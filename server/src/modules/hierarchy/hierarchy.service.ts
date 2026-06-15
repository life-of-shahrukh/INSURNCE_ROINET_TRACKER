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

  /**
   * Maps each role to the designation that belongs DIRECTLY below it.
   * This prevents data issues (wrong managerId) from ever leaking
   * cross-level items into the scope bar.
   */
  private static readonly ROLE_TO_SUB_DESIGNATION: Partial<
    Record<string, string>
  > = {
    NATIONAL_HEAD: 'ZH',
    ZH: 'RH',
    RH: 'ASM',
    ASM: 'DM',
  };

  private async getSubordinates(
    user: AuthUser,
    _scope: HierarchyScope,
  ): Promise<FilterOptionItem[]> {
    if (user.role === Role.POSP || user.role === Role.DM) return [];

    if (user.role === Role.SUPER_ADMIN) {
      // SA has no SalesTeam record — return National Heads (managerId: null)
      const topLevel = await this.prisma.salesTeam.findMany({
        where: { managerId: null, designation: 'NATIONAL_HEAD' },
        select: { id: true, name: true, designation: true },
        orderBy: { name: 'asc' },
      });
      return topLevel.map((m) => ({
        id: m.id,
        name: `${m.name} (${m.designation})`,
        designation: m.designation,
      }));
    }

    // For all management roles: find direct subordinates, filtered by the
    // expected designation for this level to prevent cross-level contamination.
    const me = await this.prisma.salesTeam.findUnique({
      where: { userId: user.userId },
      select: { id: true },
    });
    if (!me) return [];

    const expectedDesig = HierarchyService.ROLE_TO_SUB_DESIGNATION[user.role];

    const subs = await this.prisma.salesTeam.findMany({
      where: {
        managerId: me.id,
        ...(expectedDesig ? { designation: expectedDesig } : {}),
      },
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
      select: { id: true, designation: true },
    });
    if (!parent) return { members: [], posps: [] };

    // Direct SalesTeam children one level below this member. Filter by the
    // expected child designation to guard against bad managerId data.
    const expectedDesig =
      HierarchyService.ROLE_TO_SUB_DESIGNATION[parent.designation];
    const memberRows = await this.prisma.salesTeam.findMany({
      where: {
        managerId: salesTeamId,
        ...(expectedDesig ? { designation: expectedDesig } : {}),
      },
      select: { id: true, name: true, designation: true },
      orderBy: { name: 'asc' },
    });
    const members: FilterOptionItem[] = memberRows.map((m) => ({
      id: m.id,
      name: `${m.name} (${m.designation})`,
      designation: m.designation,
    }));

    // If this member still has manager-children, POSPs are shown one level
    // deeper, so leave posps empty here.
    if (members.length > 0) return { members, posps: [] };

    // Terminal member: return ONLY the POSPs this member directly owns.
    const rows = await this.prisma.posp.findMany({
      where: { asmId: parent.id },
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    });
    const posps: FilterOptionItem[] = rows.map((p) => ({
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
