import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { HierarchyScope } from '../../common/auth/hierarchy-scope.util';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { Role } from '../../common/constants';
import { buildPospScopeWhere } from '../../common/auth/hierarchy-scope.util';

export interface FilterOptionItem {
  id: string;
  name: string;
  designation?: string;
}

export interface SubordinatesResult {
  members: FilterOptionItem[];
  posps: FilterOptionItem[];
}

export interface HierarchyFilterOptions {
  /** Distinct zones within caller's scope (ZH+) */
  zones: FilterOptionItem[];
  /** Distinct regions within caller's scope (RH+) */
  regions: FilterOptionItem[];
  /** Distinct areas within caller's scope (ASM+) */
  areas: FilterOptionItem[];
  /** Distinct districts within caller's scope (DM+) */
  districts: FilterOptionItem[];
  /** Direct subordinate managers (SalesTeam members below caller) */
  subordinates: FilterOptionItem[];
  /** POSPs within caller's scope */
  posps: FilterOptionItem[];
}

@Injectable()
export class HierarchyService {
  constructor(private readonly prisma: PrismaService) {}

  async getFilterOptions(
    user: AuthUser,
    scope: HierarchyScope,
  ): Promise<HierarchyFilterOptions> {
    const pospWhere = buildPospScopeWhere(scope);

    // Fetch posps within scope (or all for SUPER_ADMIN/NATIONAL_HEAD)
    const posps = await this.prisma.posp.findMany({
      where: Object.keys(pospWhere).length > 0 ? pospWhere : undefined,
      select: {
        id: true,
        name: true,
        code: true,
        zoneId: true,
        regionId: true,
        areaId: true,
        districtId: true,
      },
    });

    const zones = distinct(posps, 'zoneId');
    const regions = distinct(posps, 'regionId');
    const areas = distinct(posps, 'areaId');
    const districts = distinct(posps, 'districtId');

    const pospOptions: FilterOptionItem[] = posps.map((p) => ({
      id: p.id,
      name: `${p.name} (${p.code})`,
    }));

    // Subordinate SalesTeam members below the caller
    const subordinates = await this.getSubordinates(user, scope);

    return {
      zones,
      regions,
      areas,
      districts,
      subordinates,
      posps: pospOptions,
    };
  }

  private async getSubordinates(
    user: AuthUser,
    _scope: HierarchyScope,
  ): Promise<FilterOptionItem[]> {
    if (user.role === Role.POSP) return [];

    if (user.role === Role.SUPER_ADMIN || user.role === Role.NATIONAL_HEAD) {
      // For top-level roles, return Zone Heads (top of the sales hierarchy)
      const topLevel = await this.prisma.salesTeam.findMany({
        where: { managerId: null },
        select: { id: true, name: true, designation: true },
        orderBy: { name: 'asc' },
      });
      return topLevel.map((m) => ({
        id: m.id,
        name: `${m.name} (${m.designation})`,
        designation: m.designation,
      }));
    }

    // Find the caller's SalesTeam record
    const me = await this.prisma.salesTeam.findUnique({
      where: { userId: user.userId },
      select: { id: true },
    });
    if (!me) return [];

    // Get direct subordinates from the hierarchy
    const subs = await this.prisma.salesTeam.findMany({
      where: { managerId: me.id },
      select: { id: true, name: true, designation: true },
      orderBy: { name: 'asc' },
    });
    return subs.map((m) => ({
      id: m.id,
      name: `${m.name} (${m.designation})`,
      designation: m.designation,
    }));
  }

  /**
   * Returns the direct SalesTeam children and POSPs under a specific SalesTeam member.
   * Used by the cascading drill-down scope bar on the frontend.
   */
  async getSubordinatesForMember(
    salesTeamId: string,
  ): Promise<SubordinatesResult> {
    const parent = await this.prisma.salesTeam.findUnique({
      where: { id: salesTeamId },
      select: { id: true, designation: true, areaId: true },
    });
    if (!parent) return { members: [], posps: [] };

    // Get direct SalesTeam children (next level managers)
    const memberRows = await this.prisma.salesTeam.findMany({
      where: { managerId: salesTeamId },
      select: { id: true, name: true, designation: true },
      orderBy: { name: 'asc' },
    });
    const members: FilterOptionItem[] = memberRows.map((m) => ({
      id: m.id,
      name: `${m.name} (${m.designation})`,
      designation: m.designation,
    }));

    // If this member has children (not at terminal level), posps stay empty
    if (members.length > 0) return { members, posps: [] };

    // Terminal level (ASM or DM): resolve their POSPs
    let pospRows: Array<{ id: string; name: string; code: string }> = [];

    if (parent.designation === 'ASM') {
      pospRows = await this.prisma.posp.findMany({
        where: { asmId: parent.id },
        select: { id: true, name: true, code: true },
        orderBy: { name: 'asc' },
      });
    } else if (parent.designation === 'DM' && parent.areaId) {
      pospRows = await this.prisma.posp.findMany({
        where: { areaId: parent.areaId },
        select: { id: true, name: true, code: true },
        orderBy: { name: 'asc' },
      });
    }

    const posps: FilterOptionItem[] = pospRows.map((p) => ({
      id: p.id,
      name: `${p.name} (${p.code})`,
    }));

    return { members: [], posps };
  }
}

/** Extracts distinct non-null values for a POSP field, returning id + name. */
function distinct(
  posps: Array<{
    zoneId?: string | null;
    regionId?: string | null;
    areaId?: string | null;
    districtId?: string | null;
  }>,
  field: 'zoneId' | 'regionId' | 'areaId' | 'districtId',
): FilterOptionItem[] {
  const seen = new Set<string>();
  const items: FilterOptionItem[] = [];
  for (const p of posps) {
    const val = p[field];
    if (val && !seen.has(val)) {
      seen.add(val);
      items.push({ id: val, name: val });
    }
  }
  return items.sort((a, b) => a.name.localeCompare(b.name));
}
