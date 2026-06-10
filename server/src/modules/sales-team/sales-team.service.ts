import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SalesTeamRepository } from './sales-team.repository';
import { CreateSalesTeamDto } from './dto/create-sales-team.dto';
import { UpdateSalesTeamDto } from './dto/update-sales-team.dto';
import { externalApi, HierarchyEntry } from '../../common/external-api/external-api.service';
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
  level: number;        // 1=DM … 6=R5
  designation: string;  // 'DM' | 'R1' | 'R2' | 'R3' | 'R4' | 'R5'
  districtName?: string;
}

@Injectable()
export class SalesTeamService {
  private readonly logger = new Logger(SalesTeamService.name);

  constructor(
    private readonly repository: SalesTeamRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateSalesTeamDto): Promise<SalesTeam> {
    const existing = await this.repository.findByEmployeeCode(dto.employeeCode);
    if (existing) {
      throw new BadRequestException(`Employee code ${dto.employeeCode} already exists`);
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

  async findAll(query: SalesTeamListQueryDto): Promise<PaginatedResult<SalesTeam>> {
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
    if (!existing) throw new NotFoundException(`SalesTeam member with ID ${id} not found`);

    return this.repository.update(id, dto);
  }

  /**
   * Sync sales team hierarchy from ListHierarchyUserData external API.
   * Creates a placeholder User if none exists for the given employee code,
   * then upserts the SalesTeam record.
   */
  async syncFromExternalApi(): Promise<{ synced: number }> {
    this.logger.log('Starting sales team sync from external API...');

    let hierarchyData: Awaited<ReturnType<typeof externalApi.getHierarchyUserData>>;
    try {
      hierarchyData = await externalApi.getHierarchyUserData();
    } catch (err) {
      this.logger.error('Failed to fetch hierarchy data', err);
      throw new BadRequestException('Failed to fetch hierarchy data from external API');
    }

    // Collect unique users from all R1-R5 levels + DistrictManagers
    const userMap = new Map<string, { id: string; code: string; name: string; level: number }>();

    for (const entry of hierarchyData) {
      if (entry.DistrictManagerId) {
        userMap.set(entry.DistrictManagerId, {
          id: entry.DistrictManagerId,
          code: entry.DistrictManagerCode,
          name: entry.DistrictManagerName,
          level: 1,
        });
      }
      const levels = ['R1', 'R2', 'R3', 'R4', 'R5'] as const;
      levels.forEach((r, idx) => {
        const uid = entry[`${r}_UserId` as keyof typeof entry] as string;
        const ucode = entry[`${r}_UserCode` as keyof typeof entry] as string;
        const uname = entry[`${r}_UserName` as keyof typeof entry] as string;
        if (uid && ucode) {
          userMap.set(uid, { id: uid, code: ucode, name: uname, level: idx + 2 });
        }
      });
    }

    let synced = 0;
    for (const [, person] of userMap.entries()) {
      if (!person.code) continue;
      try {
        // Ensure a User record exists (placeholder for sync)
        let user = await this.prisma.user.findFirst({
          where: { email: `${person.code.toLowerCase()}@roinet.sync` },
        });

        if (!user) {
          user = await this.prisma.user.create({
            data: {
              email: `${person.code.toLowerCase()}@roinet.sync`,
              passwordHash: 'sync-placeholder',
              role: 'SALES_TEAM',
              status: 'ACTIVE',
            },
          });
        }

        await this.repository.upsertByEmployeeCode(person.code, {
          user: { connect: { id: user.id } },
          name: person.name || person.code,
          employeeCode: person.code,
          designation: person.level === 1 ? 'ASM' : person.level === 2 ? 'RH' : 'ZH',
          mobile: '0000000000',
          email: `${person.code.toLowerCase()}@roinet.sync`,
          joiningDate: new Date(),
        });

        synced++;
      } catch (err) {
        this.logger.warn(`Failed to sync user ${person.code}: ${err}`);
      }
    }

    this.logger.log(`Sync complete. Synced ${synced} team members.`);
    return { synced };
  }

  /**
   * Build a flat OrgNode[] from the Cognitensor ListHierarchyUserData response.
   * Each HierarchyEntry row represents a district chain: R5→R4→R3→R2→R1→DM.
   * Nodes are deduplicated by UserId; parent-child links are derived per row.
   */
  async getOrgChartNodes(): Promise<OrgNode[]> {
    let hierarchyData: HierarchyEntry[];
    try {
      hierarchyData = await externalApi.getHierarchyUserData();
    } catch (err) {
      this.logger.error('Failed to fetch hierarchy data for org chart', err);
      
      // TEMPORARY: Return mock data if external API is unavailable/unauthorized
      this.logger.warn('Returning mock org chart data as fallback');
      return this.getMockOrgChartNodes();
    }

    const nodeMap = new Map<string, OrgNode>();

    const levels = ['R5', 'R4', 'R3', 'R2', 'R1'] as const;
    const levelIndex: Record<string, number> = { R5: 6, R4: 5, R3: 4, R2: 3, R1: 2 };

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
        const uid = entry[`${r}_UserId` as keyof HierarchyEntry] as string;
        const ucode = entry[`${r}_UserCode` as keyof HierarchyEntry] as string;
        const uname = entry[`${r}_UserName` as keyof HierarchyEntry] as string;
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
        const uid = entry[`${r}_UserId` as keyof HierarchyEntry] as string;
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
      { id: 'R5-001', parentId: null, name: 'Rajesh Kumar', employeeCode: 'NH001', level: 6, designation: 'R5' },
      
      // R4: Zonal Heads
      { id: 'R4-001', parentId: 'R5-001', name: 'Amit Sharma', employeeCode: 'ZH001', level: 5, designation: 'R4' },
      { id: 'R4-002', parentId: 'R5-001', name: 'Priya Singh', employeeCode: 'ZH002', level: 5, designation: 'R4' },
      
      // R3: Regional Heads
      { id: 'R3-001', parentId: 'R4-001', name: 'Vikram Patel', employeeCode: 'RH001', level: 4, designation: 'R3' },
      { id: 'R3-002', parentId: 'R4-001', name: 'Sunita Desai', employeeCode: 'RH002', level: 4, designation: 'R3' },
      { id: 'R3-003', parentId: 'R4-002', name: 'Ravi Gupta', employeeCode: 'RH003', level: 4, designation: 'R3' },
      
      // R2: ASMs
      { id: 'R2-001', parentId: 'R3-001', name: 'Karan Mehta', employeeCode: 'ASM001', level: 3, designation: 'R2' },
      { id: 'R2-002', parentId: 'R3-001', name: 'Neha Joshi', employeeCode: 'ASM002', level: 3, designation: 'R2' },
      { id: 'R2-003', parentId: 'R3-002', name: 'Sanjay Rao', employeeCode: 'ASM003', level: 3, designation: 'R2' },
      { id: 'R2-004', parentId: 'R3-003', name: 'Anita Verma', employeeCode: 'ASM004', level: 3, designation: 'R2' },
      
      // R1: DM Clusters
      { id: 'R1-001', parentId: 'R2-001', name: 'Deepak Nair', employeeCode: 'DMC001', level: 2, designation: 'R1' },
      { id: 'R1-002', parentId: 'R2-002', name: 'Pooja Iyer', employeeCode: 'DMC002', level: 2, designation: 'R1' },
      { id: 'R1-003', parentId: 'R2-003', name: 'Manoj Kumar', employeeCode: 'DMC003', level: 2, designation: 'R1' },
      
      // DMs: District Managers
      { id: 'DM-001', parentId: 'R1-001', name: 'Anil Reddy', employeeCode: 'DM001', level: 1, designation: 'DM', districtName: 'Mumbai Central' },
      { id: 'DM-002', parentId: 'R1-001', name: 'Geeta Shah', employeeCode: 'DM002', level: 1, designation: 'DM', districtName: 'Mumbai Suburban' },
      { id: 'DM-003', parentId: 'R1-002', name: 'Ramesh Pillai', employeeCode: 'DM003', level: 1, designation: 'DM', districtName: 'Pune' },
      { id: 'DM-004', parentId: 'R1-002', name: 'Kavita Menon', employeeCode: 'DM004', level: 1, designation: 'DM', districtName: 'Nashik' },
      { id: 'DM-005', parentId: 'R1-003', name: 'Suresh Yadav', employeeCode: 'DM005', level: 1, designation: 'DM', districtName: 'Bangalore North' },
      { id: 'DM-006', parentId: 'R1-003', name: 'Lakshmi Krishnan', employeeCode: 'DM006', level: 1, designation: 'DM', districtName: 'Bangalore South' },
    ];
  }
}
