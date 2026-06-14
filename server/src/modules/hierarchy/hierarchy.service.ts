import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { HierarchyScope } from '../../common/auth/hierarchy-scope.util';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { Role } from '../../common/constants';
import { buildPospScopeWhere } from '../../common/auth/hierarchy-scope.util';

export interface FilterOptionItem {
  id: string;
  name: string;
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

    return { zones, regions, areas, districts, subordinates, posps: pospOptions };
  }

  private async getSubordinates(
    user: AuthUser,
    scope: HierarchyScope,
  ): Promise<FilterOptionItem[]> {
    // POSP has no subordinates; SUPER_ADMIN/NATIONAL_HEAD can see all team members
    if (user.role === Role.POSP) return [];

    if (user.role === Role.SUPER_ADMIN || user.role === Role.NATIONAL_HEAD) {
      const all = await this.prisma.salesTeam.findMany({
        select: { id: true, name: true, designation: true },
        orderBy: { name: 'asc' },
      });
      return all.map((m) => ({ id: m.id, name: `${m.name} (${m.designation})` }));
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
    return subs.map((m) => ({ id: m.id, name: `${m.name} (${m.designation})` }));
  }
}

/** Extracts distinct non-null values for a POSP field, returning id + name. */
function distinct(
  posps: Array<{ zoneId?: string | null; regionId?: string | null; areaId?: string | null; districtId?: string | null }>,
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
