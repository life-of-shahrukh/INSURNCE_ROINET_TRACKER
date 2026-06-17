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

export interface OrgNode {
  id: string;
  parentId: string | null;
  name: string;
  employeeCode: string;
  level: number; // 1=DM … 6=R5
  designation: string; // 'DM' | 'R1' | 'R2' | 'R3' | 'R4' | 'R5'
  districtName?: string;
}

@Injectable()
export class SalesTeamService {
  private readonly logger = new Logger(SalesTeamService.name);

  constructor(
    private readonly repository: SalesTeamRepository,
    private readonly prisma: PrismaService,
    private readonly externalApiService: ExternalApiService,
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
   * Canonical chain in ListHierarchyUserData (bottom → top):
   * DistrictManager → R1 → R2 → R3 → R4. The R-labels are positional, not
   * role names, so we map them to our roles explicitly.
   */
  private static readonly LEVEL_TO_DESIGNATION: Record<number, string> = {
    1: 'DM', // DistrictManager
    2: 'ASM', // R1
    3: 'RH', // R2
    4: 'ZH', // R3
    5: 'NATIONAL_HEAD', // R4
  };

  /**
   * Sync sales team hierarchy from ListHierarchyUserData external API.
   * Creates a placeholder User if none exists for the given employee code,
   * then upserts the SalesTeam record with the correct designation and
   * manager link derived from the district chain.
   */
  async syncFromExternalApi(): Promise<{
    members: number;
    districts: number;
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
          entry[`${r}_UserCode` as keyof typeof entry],
          entry[`${r}_UserName` as keyof typeof entry],
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

    // Pass 1: upsert each person (designation + placeholder user).
    let members = 0;
    for (const person of people.values()) {
      const designation =
        SalesTeamService.LEVEL_TO_DESIGNATION[person.level] ?? 'DM';
      try {
        const email = `${person.code.toLowerCase()}@roinet.sync`;
        let user = await this.prisma.user.findFirst({ where: { email } });
        if (!user) {
          user = await this.prisma.user.create({
            data: {
              email,
              passwordHash: 'sync-placeholder',
              role: designation,
              status: 'ACTIVE',
            },
          });
        } else if (user.role !== designation) {
          await this.prisma.user.update({
            where: { id: user.id },
            data: { role: designation },
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

    const districts = await this.syncDistrictHierarchy(hierarchyData);
    const pospsGeo = await this.syncPospGeography();

    this.logger.log(
      `Sync complete. members=${members} districts=${districts} pospsGeo=${pospsGeo}`,
    );
    return { members, districts, pospsGeo };
  }

  /**
   * Upserts one DistrictHierarchy row per ListHierarchyUserData entry. This is
   * the source of truth for geographic scoping: a manager covers a district
   * when their code appears in the matching level column.
   */
  async syncDistrictHierarchy(
    hierarchyData?: HierarchyEntry[],
  ): Promise<number> {
    const data = hierarchyData ?? this.externalApiService.listHierarchy();

    // districtId → stateId map from the districts snapshot (hierarchy rows
    // carry no stateId of their own).
    const stateByDistrict = new Map<string, string>();
    try {
      for (const d of this.externalApiService.listDistricts('')) {
        stateByDistrict.set(d.DistrictId, d.StateId);
      }
    } catch {
      // districts snapshot optional; stateId stays null if unavailable
    }

    let count = 0;
    for (const e of data) {
      if (!e.DistrictId) continue;
      const payload = {
        districtName: e.DistrictName || null,
        stateId: stateByDistrict.get(e.DistrictId) ?? null,
        dmId: e.DistrictManagerId || null,
        dmCode: e.DistrictManagerCode || null,
        dmName: e.DistrictManagerName || null,
        asmId: e.R1_UserId || null,
        asmCode: e.R1_UserCode || null,
        asmName: e.R1_UserName || null,
        rhId: e.R2_UserId || null,
        rhCode: e.R2_UserCode || null,
        rhName: e.R2_UserName || null,
        zhId: e.R3_UserId || null,
        zhCode: e.R3_UserCode || null,
        zhName: e.R3_UserName || null,
        nhId: e.R4_UserId || null,
        nhCode: e.R4_UserCode || null,
        nhName: e.R4_UserName || null,
      };
      try {
        await this.prisma.districtHierarchy.upsert({
          where: { districtId: e.DistrictId },
          create: { districtId: e.DistrictId, ...payload },
          update: payload,
        });
        count++;
      } catch (err) {
        this.logger.warn(`Failed to upsert district ${e.DistrictId}: ${err}`);
      }
    }
    this.logger.log(`Synced ${count} district hierarchy rows.`);
    return count;
  }

  /**
   * Backfills Posp.districtId/stateId/cityId from ListPospData. SSO login
   * already populates this per-POSP; this fills in everyone else.
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
   * Build a flat OrgNode[] from the live Cognitensor ListHierarchyUserData API.
   * Each HierarchyEntry row represents a district chain: R5→R4→R3→R2→R1→DM.
   * Nodes are deduplicated by UserId; parent-child links are derived per row.
   */
  async getOrgChartNodes(): Promise<OrgNode[]> {
    this.logger.log('getOrgChartNodes: calling live Cognitensor API...');
    let hierarchyData: HierarchyEntry[];
    try {
      hierarchyData = await this.externalApiService.listHierarchyLive();
      this.logger.log(
        `getOrgChartNodes: received ${hierarchyData?.length ?? 'null'} entries from live API`,
      );
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `getOrgChartNodes: live API failed - ${errMsg}`,
        err instanceof Error ? err.stack : undefined,
      );
      this.logger.warn('getOrgChartNodes: falling back to snapshot');
      hierarchyData = this.externalApiService.listHierarchy();
      this.logger.log(
        `getOrgChartNodes: snapshot returned ${hierarchyData.length} entries`,
      );
    }

    const nodeMap = new Map<string, OrgNode>();

    const levels = ['R5', 'R4', 'R3', 'R2', 'R1'] as const;
    const levelIndex: Record<string, number> = {
      R5: 6,
      R4: 5,
      R3: 4,
      R2: 3,
      R1: 2,
    };

    for (const entry of hierarchyData) {
      // Add DM node
      if (entry.DistrictManagerId) {
        if (!nodeMap.has(entry.DistrictManagerId)) {
          nodeMap.set(entry.DistrictManagerId, {
            id: entry.DistrictManagerId,
            parentId: null, // will be set below
            name: entry.DistrictManagerName || entry.DistrictManagerCode,
            employeeCode: entry.DistrictManagerCode,
            level: 1,
            designation: 'DM',
            districtName: entry.DistrictName,
          });
        }
      }

      // Add R1–R5 nodes
      for (const r of levels) {
        const uid = entry[`${r}_UserId` as keyof HierarchyEntry];
        const ucode = entry[`${r}_UserCode` as keyof HierarchyEntry];
        const uname = entry[`${r}_UserName` as keyof HierarchyEntry];
        if (uid && !nodeMap.has(uid)) {
          nodeMap.set(uid, {
            id: uid,
            parentId: null,
            name: uname || ucode,
            employeeCode: ucode,
            level: levelIndex[r],
            designation: r,
          });
        }
      }

      // Link parent-child along the chain: DM→R1→R2→R3→R4→R5
      // Build an ordered chain of present IDs from bottom (DM) to top (R5)
      const chain: string[] = [];
      if (entry.DistrictManagerId) chain.push(entry.DistrictManagerId);
      for (const r of ['R1', 'R2', 'R3', 'R4', 'R5'] as const) {
        const uid = entry[`${r}_UserId` as keyof HierarchyEntry];
        if (uid) chain.push(uid);
      }

      // chain[i].parentId = chain[i+1] (next in chain is the parent)
      for (let i = 0; i < chain.length - 1; i++) {
        const node = nodeMap.get(chain[i]);
        if (node && node.parentId === null) {
          node.parentId = chain[i + 1];
        }
      }
    }

    return Array.from(nodeMap.values());
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
