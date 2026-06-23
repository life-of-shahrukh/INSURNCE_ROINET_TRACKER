import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SalesTeamRepository } from './sales-team.repository';
import { CreateSalesTeamDto } from './dto/create-sales-team.dto';
import { UpdateSalesTeamDto } from './dto/update-sales-team.dto';
import {
  ExternalApiService,
  type HierarchyEntry,
} from '../../common/external-api/external-api.service';
import type { SalesTeam } from '@prisma/client';
import { SalesTeamListQueryDto } from './dto/sales-team-list-query.dto';
import { buildSalesTeamFilterWhere } from './sales-team-filter.util';
import { resolvePagination } from '../../common/utils/pagination.util';
import type { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { OrgSyncService } from '../org-sync/org-sync.service';
import type { OrgGraphCounts } from '../../common/org-graph/org-graph.repository';
import {
  loadDistrictOwnersByDistrictId,
  loadPospsForOrgChart,
} from '../../common/org-graph/org-chart-posp.util';
import {
  OrgRole,
  orgRoleRank,
  appRoleFromOrgRole,
} from '../../common/external-api/user-type.util';
import { buildOrgGraph } from '../../common/org-graph/org-graph-builder';
import { resolvePospDisplayName } from '../../common/external-api/posp-display.util';

export interface OrgNode {
  id: string;
  parentId: string | null;
  name: string;
  employeeCode: string;
  level: number; // 1=DM … 6=R5
  designation: string; // 'DM' | 'R1' | … | 'POSP'
  districtName?: string;
}

@Injectable()
export class SalesTeamService {
  private readonly logger = new Logger(SalesTeamService.name);

  constructor(
    private readonly repository: SalesTeamRepository,
    private readonly prisma: PrismaService,
    private readonly externalApiService: ExternalApiService,
    private readonly orgSyncService: OrgSyncService,
  ) {}

  async create(dto: CreateSalesTeamDto): Promise<SalesTeam> {
    const existing = await this.repository.findByEmployeeCode(dto.employeeCode);
    if (existing) {
      throw new BadRequestException(
        `Employee code ${dto.employeeCode} already exists`,
      );
    }

    return this.repository.create({
      user: { connect: { id: dto.userId } },
      name: dto.name,
      employeeCode: dto.employeeCode,
      designation: dto.designation,
      ...(dto.managerId && { manager: { connect: { id: dto.managerId } } }),
      territory: dto.territory,
      mobile: dto.mobile,
      email: dto.email,
      joiningDate: dto.joiningDate,
    });
  }

  async exportCsv(query: SalesTeamListQueryDto): Promise<string> {
    const where = buildSalesTeamFilterWhere(query);
    return this.repository.exportCsvWhere(where);
  }

  async findAll(
    query: SalesTeamListQueryDto,
  ): Promise<PaginatedResult<SalesTeam>> {
    const { skip, take, page, pageSize } = resolvePagination(query);
    const where = buildSalesTeamFilterWhere(query);
    return this.repository.findPaginated(
      where,
      skip,
      take,
      page,
      pageSize,
      query.sortBy,
      query.sortOrder,
    );
  }

  async getHierarchy(): Promise<SalesTeam[]> {
    return this.repository.findRoots();
  }

  async update(id: string, dto: UpdateSalesTeamDto): Promise<SalesTeam> {
    const existing = await this.repository.findById(id);
    if (!existing)
      throw new NotFoundException(`SalesTeam member with ID ${id} not found`);

    return this.repository.update(id, dto);
  }

  /**
   * Sync sales team hierarchy from ListHierarchyUserData external API.
   * Creates a placeholder User if none exists for the given employee code,
   * then upserts the SalesTeam record with the correct designation and
   * manager link derived from the district chain.
   */
  async syncFromExternalApi(): Promise<{
    members: number;
    org: OrgGraphCounts;
    pospsGeo: number;
  }> {
    this.logger.log('Starting sales team sync from external API...');

    let hierarchyData: HierarchyEntry[];
    try {
      hierarchyData = this.externalApiService.listHierarchy();
    } catch (err) {
      this.logger.error('Failed to fetch hierarchy data', err);
      throw new BadRequestException(
        'Failed to fetch hierarchy data from external API',
      );
    }

    // Collect unique people keyed by employee code, plus child→parent links.
    const people = new Map<
      string,
      { code: string; name: string; level: number }
    >();
    const childToParent = new Map<string, string>();

    const addPerson = (code: string, name: string, level: number): void => {
      if (!code) return;
      if (!people.has(code))
        people.set(code, { code, name: name || code, level });
    };

    for (const entry of hierarchyData) {
      addPerson(entry.DistrictManagerCode, entry.DistrictManagerName, 1);
      const rLevels = ['R1', 'R2', 'R3', 'R4'] as const;
      rLevels.forEach((r, idx) => {
        addPerson(
          (entry[`${r}_UserCode` as keyof typeof entry] as string) ?? '',
          (entry[`${r}_UserName` as keyof typeof entry] as string) ?? '',
          idx + 2,
        );
      });

      // Ordered chain of codes bottom → top; each link is child → its parent.
      const chain = [
        entry.DistrictManagerCode,
        entry.R1_UserCode,
        entry.R2_UserCode,
        entry.R3_UserCode,
        entry.R4_UserCode,
      ].filter((c): c is string => !!c);
      for (let i = 0; i < chain.length - 1; i++) {
        if (!childToParent.has(chain[i])) {
          childToParent.set(chain[i], chain[i + 1]);
        }
      }
    }

    const graphSeed = buildOrgGraph(hierarchyData);
    const orgRoleByCode = new Map(
      graphSeed.members.map((m) => [m.userCode, m.role as OrgRole]),
    );
    const appRoleByCode = new Map(
      graphSeed.members.map((m) => [
        m.userCode,
        appRoleFromOrgRole(m.role as OrgRole),
      ]),
    );

    // Pass 1: upsert each person (designation + placeholder user).
    let members = 0;
    for (const person of people.values()) {
      const orgRole = orgRoleByCode.get(person.code);
      const appRole = appRoleByCode.get(person.code) ?? 'DM';
      const designation = orgRole ?? 'DM';
      try {
        const email = `${person.code.toLowerCase()}@roinet.sync`;
        let user = await this.prisma.user.findFirst({ where: { email } });
        if (!user) {
          user = await this.prisma.user.create({
            data: {
              email,
              passwordHash: 'sync-placeholder',
              role: appRole,
              status: 'ACTIVE',
            },
          });
        } else if (user.role !== appRole) {
          await this.prisma.user.update({
            where: { id: user.id },
            data: { role: appRole },
          });
        }

        await this.repository.upsertByEmployeeCode(person.code, {
          user: { connect: { id: user.id } },
          name: person.name,
          employeeCode: person.code,
          designation,
          mobile: '0000000000',
          email,
          joiningDate: new Date(),
        });
        members++;
      } catch (err) {
        this.logger.warn(`Failed to sync user ${person.code}: ${err}`);
      }
    }

    // Pass 2: wire up manager links now that every SalesTeam row exists.
    const codeToId = new Map<string, string>();
    const rows = await this.prisma.salesTeam.findMany({
      select: { id: true, employeeCode: true },
    });
    for (const r of rows) codeToId.set(r.employeeCode, r.id);
    for (const [childCode, parentCode] of childToParent.entries()) {
      const childId = codeToId.get(childCode);
      const parentId = codeToId.get(parentCode);
      if (childId && parentId && childId !== parentId) {
        await this.prisma.salesTeam
          .update({ where: { id: childId }, data: { managerId: parentId } })
          .catch((err) =>
            this.logger.warn(`Failed to link ${childCode}: ${err}`),
          );
      }
    }

    // Rebuild the org graph (OrgMember/OrgEdge/OrgClosure/DistrictChain) — the
    // source of truth for hierarchy scoping. SalesTeam rows above still exist
    // for the internal CRM tree view, but no longer drive data scoping.
    const org = await this.orgSyncService.rebuild();
    const pospsGeo = await this.syncPospGeography();

    this.logger.log(
      `Sync complete. members=${members} org(members=${org.members}, districtChains=${org.districtChains}) pospsGeo=${pospsGeo}`,
    );
    return { members, org, pospsGeo };
  }

  /**
   * Backfills Posp.name and geography from ListPospData (`username` → name).
   * SSO login already updates per-POSP; this fills in everyone else on org sync.
   */
  async syncPospGeography(): Promise<number> {
    let posps;
    try {
      posps = this.externalApiService.listAllPosps();
    } catch (err) {
      this.logger.warn(`Failed to read POSP snapshot for geo sync: ${err}`);
      return 0;
    }

    let count = 0;
    for (const p of posps) {
      const res = await this.prisma.posp.updateMany({
        where: { OR: [{ code: p.UserCode }, { externalId: p.UserId }] },
        data: {
          name: resolvePospDisplayName(p),
          districtId: p.districtid || null,
          stateId: p.stateid || null,
          cityId: p.cityid || null,
        },
      });
      count += res.count;
    }
    this.logger.log(`Synced geography for ${count} POSPs.`);
    return count;
  }

  /**
   * Build a flat OrgNode[] from the persisted org graph (OrgMember + OrgEdge +
   * DistrictChain). The graph is refreshed weekly from Cognitensor by
   * OrgSyncService (and on-demand via POST /sales-team/sync), so this endpoint
   * never calls the live API per request — it just reads the DB, which keeps it
   * fast and resilient to VPN/network availability.
   */
  async getOrgChartNodes(): Promise<OrgNode[]> {
    const members = await this.prisma.orgMember.findMany({
      select: {
        id: true,
        userId: true,
        userCode: true,
        userName: true,
        role: true,
      },
    });
    if (members.length === 0) {
      this.logger.warn(
        'getOrgChartNodes: org graph is empty — run a sync (weekly cron or POST /sales-team/sync)',
      );
      return [];
    }

    const userIdByMemberId = new Map(members.map((m) => [m.id, m.userId]));

    // Parent links from the deduplicated adjacency list; first manager wins.
    const edges = await this.prisma.orgEdge.findMany({
      select: { memberId: true, managerId: true },
    });
    const parentMemberOf = new Map<string, string>();
    for (const e of edges) {
      if (!parentMemberOf.has(e.memberId)) {
        parentMemberOf.set(e.memberId, e.managerId);
      }
    }

    // District label for district-owner members (chainLevel 0).
    const owners = await this.prisma.districtChain.findMany({
      where: { chainLevel: 0 },
      select: { memberId: true, districtName: true },
    });
    const districtNameByMemberId = new Map<string, string>();
    for (const o of owners) {
      if (o.districtName && !districtNameByMemberId.has(o.memberId)) {
        districtNameByMemberId.set(o.memberId, o.districtName);
      }
    }

    const nodeMap = new Map<string, OrgNode>();
    for (const m of members) {
      const role = m.role || OrgRole.UNKNOWN;
      const parentMemberId = parentMemberOf.get(m.id);
      const parentUserId = parentMemberId
        ? (userIdByMemberId.get(parentMemberId) ?? null)
        : null;
      nodeMap.set(m.userId, {
        id: m.userId,
        parentId: parentUserId,
        name: m.userName || m.userCode,
        employeeCode: m.userCode,
        level: orgRoleRank(role as OrgRole),
        designation: role,
        districtName: districtNameByMemberId.get(m.id),
      });
    }

    await this.appendPospNodes(
      nodeMap,
      await loadDistrictOwnersByDistrictId(this.prisma),
    );
    this.logger.log(`getOrgChartNodes: built ${nodeMap.size} nodes from DB`);
    return Array.from(nodeMap.values());
  }

  /**
   * Adds POSP leaf nodes under each district's owner. Parent is the district
   * manager Cognitensor UserId so links match manager nodes in `nodeMap`.
   */
  private async appendPospNodes(
    nodeMap: Map<string, OrgNode>,
    ownersByDistrict: Map<
      string,
      { userId: string; districtName: string | null }
    >,
  ): Promise<void> {
    const posps = await loadPospsForOrgChart(this.prisma);
    let attached = 0;

    for (const p of posps) {
      const owner = ownersByDistrict.get(p.districtId);
      if (!owner || !nodeMap.has(owner.userId)) continue;

      const nodeId = p.externalId ?? p.id;
      if (nodeMap.has(nodeId)) continue;

      nodeMap.set(nodeId, {
        id: nodeId,
        parentId: owner.userId,
        name: p.name || p.code,
        employeeCode: p.code,
        level: 0,
        designation: 'POSP',
        districtName: owner.districtName ?? undefined,
      });
      attached++;
    }

    this.logger.log(
      `Org chart: attached ${attached} POSP nodes under district managers`,
    );
  }

  /**
   * Mock org chart data for development/fallback when external API is unavailable
   */
  private getMockOrgChartNodes(): OrgNode[] {
    return [
      // R5: National Head
      {
        id: 'R5-001',
        parentId: null,
        name: 'Rajesh Kumar',
        employeeCode: 'NH001',
        level: 6,
        designation: 'R5',
      },

      // R4: Zonal Heads
      {
        id: 'R4-001',
        parentId: 'R5-001',
        name: 'Amit Sharma',
        employeeCode: 'ZH001',
        level: 5,
        designation: 'R4',
      },
      {
        id: 'R4-002',
        parentId: 'R5-001',
        name: 'Priya Singh',
        employeeCode: 'ZH002',
        level: 5,
        designation: 'R4',
      },

      // R3: Regional Heads
      {
        id: 'R3-001',
        parentId: 'R4-001',
        name: 'Vikram Patel',
        employeeCode: 'RH001',
        level: 4,
        designation: 'R3',
      },
      {
        id: 'R3-002',
        parentId: 'R4-001',
        name: 'Sunita Desai',
        employeeCode: 'RH002',
        level: 4,
        designation: 'R3',
      },
      {
        id: 'R3-003',
        parentId: 'R4-002',
        name: 'Ravi Gupta',
        employeeCode: 'RH003',
        level: 4,
        designation: 'R3',
      },

      // R2: ASMs
      {
        id: 'R2-001',
        parentId: 'R3-001',
        name: 'Karan Mehta',
        employeeCode: 'ASM001',
        level: 3,
        designation: 'R2',
      },
      {
        id: 'R2-002',
        parentId: 'R3-001',
        name: 'Neha Joshi',
        employeeCode: 'ASM002',
        level: 3,
        designation: 'R2',
      },
      {
        id: 'R2-003',
        parentId: 'R3-002',
        name: 'Sanjay Rao',
        employeeCode: 'ASM003',
        level: 3,
        designation: 'R2',
      },
      {
        id: 'R2-004',
        parentId: 'R3-003',
        name: 'Anita Verma',
        employeeCode: 'ASM004',
        level: 3,
        designation: 'R2',
      },

      // R1: DM Clusters
      {
        id: 'R1-001',
        parentId: 'R2-001',
        name: 'Deepak Nair',
        employeeCode: 'DMC001',
        level: 2,
        designation: 'R1',
      },
      {
        id: 'R1-002',
        parentId: 'R2-002',
        name: 'Pooja Iyer',
        employeeCode: 'DMC002',
        level: 2,
        designation: 'R1',
      },
      {
        id: 'R1-003',
        parentId: 'R2-003',
        name: 'Manoj Kumar',
        employeeCode: 'DMC003',
        level: 2,
        designation: 'R1',
      },

      // DMs: District Managers
      {
        id: 'DM-001',
        parentId: 'R1-001',
        name: 'Anil Reddy',
        employeeCode: 'DM001',
        level: 1,
        designation: 'DM',
        districtName: 'Mumbai Central',
      },
      {
        id: 'DM-002',
        parentId: 'R1-001',
        name: 'Geeta Shah',
        employeeCode: 'DM002',
        level: 1,
        designation: 'DM',
        districtName: 'Mumbai Suburban',
      },
      {
        id: 'DM-003',
        parentId: 'R1-002',
        name: 'Ramesh Pillai',
        employeeCode: 'DM003',
        level: 1,
        designation: 'DM',
        districtName: 'Pune',
      },
      {
        id: 'DM-004',
        parentId: 'R1-002',
        name: 'Kavita Menon',
        employeeCode: 'DM004',
        level: 1,
        designation: 'DM',
        districtName: 'Nashik',
      },
      {
        id: 'DM-005',
        parentId: 'R1-003',
        name: 'Suresh Yadav',
        employeeCode: 'DM005',
        level: 1,
        designation: 'DM',
        districtName: 'Bangalore North',
      },
      {
        id: 'DM-006',
        parentId: 'R1-003',
        name: 'Lakshmi Krishnan',
        employeeCode: 'DM006',
        level: 1,
        designation: 'DM',
        districtName: 'Bangalore South',
      },
    ];
  }
}
