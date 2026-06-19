import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPospScopeWhere,
  scopeDistrictIds,
  type HierarchyScope,
} from '../../common/auth/hierarchy-scope.util';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { Role } from '../../common/constants';
import { ExternalApiService } from '../../common/external-api/external-api.service';

export interface FilterOptionItem {
  id: string;
  name: string;
  designation?: string;
}

export interface HierarchyFilterOptions {
  /** Caller's own role */
  callerRole: string;
  /** Role label directly below the caller ('POSP' if caller is a DM) */
  nextLevel: string | null;
  /** Particular people at `nextLevel` within the caller's scope */
  subordinates: FilterOptionItem[];
  /** Geographic dimensions, scoped to the caller's territory */
  states: FilterOptionItem[];
  districts: FilterOptionItem[];
  cities: FilterOptionItem[];
  /** Manager-level dimensions, scoped to the caller's territory */
  dms: FilterOptionItem[];
  asms: FilterOptionItem[];
  rhs: FilterOptionItem[];
  zhs: FilterOptionItem[];
  /** Zones that contain at least one district in the caller's territory */
  zones: FilterOptionItem[];
  /** Regions (RH-level groupings) within the caller's territory */
  regions: FilterOptionItem[];
}

export interface SubordinatesResult {
  /** Role label of the returned `members` ('POSP' returns `posps` instead) */
  nextLevel: string | null;
  members: FilterOptionItem[];
  posps: FilterOptionItem[];
}

/** Selectable level role labels (used for the drill-down `level` param). */
export type LevelRole = 'NATIONAL_HEAD' | 'ZH' | 'RH' | 'ASM' | 'DM';

interface LevelDef {
  role: LevelRole;
}

/** Management chain, top → bottom. POSP is the terminal level below DM. */
const LEVELS: LevelDef[] = [
  { role: 'NATIONAL_HEAD' },
  { role: 'ZH' },
  { role: 'RH' },
  { role: 'ASM' },
  { role: 'DM' },
];

/** Columns selected from DistrictHierarchy for scope/drill resolution. */
const DH_SELECT = {
  districtId: true,
  districtName: true,
  stateId: true,
  dmCode: true,
  dmName: true,
  asmCode: true,
  asmName: true,
  rhCode: true,
  rhName: true,
  zhCode: true,
  zhName: true,
  nhCode: true,
  nhName: true,
} as const;

type DhRow = Prisma.DistrictHierarchyGetPayload<{ select: typeof DH_SELECT }>;

@Injectable()
export class HierarchyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly externalApi: ExternalApiService,
  ) {}

  // ── name lookups (cached per request via the snapshot service) ───────────

  private stateNameMap(): Map<string, string> {
    const map = new Map<string, string>();
    try {
      for (const s of this.externalApi.listStates())
        map.set(s.StateId, s.StateName);
    } catch {
      /* snapshot optional */
    }
    return map;
  }

  private cityNameMap(): Map<string, string> {
    const map = new Map<string, string>();
    try {
      for (const c of this.externalApi.listCities(''))
        map.set(c.CityId, c.CityName);
    } catch {
      /* snapshot optional */
    }
    return map;
  }

  // ── helpers ──────────────────────────────────────────────────────────────

  /** Extracts the (code, name) pair for a given level from a hierarchy row. */
  private levelOf(
    row: DhRow,
    role: LevelRole,
  ): { code: string | null; name: string | null } {
    switch (role) {
      case 'NATIONAL_HEAD':
        return { code: row.nhCode, name: row.nhName };
      case 'ZH':
        return { code: row.zhCode, name: row.zhName };
      case 'RH':
        return { code: row.rhCode, name: row.rhName };
      case 'ASM':
        return { code: row.asmCode, name: row.asmName };
      case 'DM':
        return { code: row.dmCode, name: row.dmName };
    }
  }

  /** Builds a typed where-clause matching a single level's code. */
  private whereForLevelCode(
    role: LevelRole,
    code: string,
  ): Prisma.DistrictHierarchyWhereInput {
    switch (role) {
      case 'NATIONAL_HEAD':
        return { nhCode: code };
      case 'ZH':
        return { zhCode: code };
      case 'RH':
        return { rhCode: code };
      case 'ASM':
        return { asmCode: code };
      case 'DM':
        return { dmCode: code };
    }
  }

  /** Distinct people at `role` across the supplied rows (deduped by code). */
  private distinctLevel(rows: DhRow[], role: LevelRole): FilterOptionItem[] {
    const seen = new Map<string, FilterOptionItem>();
    for (const r of rows) {
      const { code, name } = this.levelOf(r, role);
      if (code && !seen.has(code)) {
        seen.set(code, { id: code, name: name ?? code, designation: role });
      }
    }
    return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  /** Fetches the DistrictHierarchy rows inside the caller's scope. */
  private async scopedRows(scope: HierarchyScope): Promise<DhRow[]> {
    const ids = scopeDistrictIds(scope);
    return this.prisma.districtHierarchy.findMany({
      where: ids === null ? undefined : { districtId: { in: ids } },
      select: DH_SELECT,
    });
  }

  /** Index of the level directly below the caller; LEVELS.length ⇒ POSP. */
  private nextLevelIndex(role: string): number {
    if (role === Role.SUPER_ADMIN) return 0;
    const own = LEVELS.findIndex((l) => l.role === role);
    return own + 1; // NATIONAL_HEAD(0)→1 … DM(4)→5(=POSP)
  }

  // ── public API ─────────────────────────────────────────────────────────

  async getFilterOptions(
    user: AuthUser,
    scope: HierarchyScope,
  ): Promise<HierarchyFilterOptions> {
    const rows = await this.scopedRows(scope);

    // Geographic + manager dimensions within scope
    const districts = dedupe(
      rows.map((r) => ({
        id: r.districtId,
        name: r.districtName ?? r.districtId,
      })),
    );
    const dms = this.distinctLevel(rows, 'DM');
    const asms = this.distinctLevel(rows, 'ASM');
    const rhs = this.distinctLevel(rows, 'RH');
    const zhs = this.distinctLevel(rows, 'ZH');

    // Zones — scoped to only those containing at least one district in the caller's territory.
    // Uses the enriched districts.json snapshot (has zoneid/regionid fields).
    const callerDistrictIds = new Set(rows.map((r) => r.districtId));
    const allDistrictData = (() => {
      try {
        return this.externalApi.listDistricts('');
      } catch {
        return [];
      }
    })();
    const allZones = (() => {
      try {
        return this.externalApi.listZones();
      } catch {
        return [];
      }
    })();
    const zoneMap = new Map(allZones.map((z) => [z.Zoneid, z.ZoneName]));

    // For SUPER_ADMIN/NATIONAL_HEAD (no district restriction), show all zones.
    const callerZoneIds = new Set(
      allDistrictData
        .filter((d) => d.zoneid && callerDistrictIds.has(d.DistrictId))
        .map((d) => d.zoneid as string),
    );
    const zones =
      callerDistrictIds.size === 0
        ? allZones.map((z) => ({ id: z.Zoneid, name: z.ZoneName })).sort((a, b) => a.name.localeCompare(b.name))
        : [...callerZoneIds]
            .filter((id) => zoneMap.has(id))
            .map((id) => ({ id, name: zoneMap.get(id) as string }))
            .sort((a, b) => a.name.localeCompare(b.name));

    // Regions — scoped to regionids present in the caller's districts (from enriched snapshot).
    const regionNameFromData = new Map(
      allDistrictData
        .filter((d) => d.regionid && d.regionname)
        .map((d) => [d.regionid as string, d.regionname as string]),
    );
    const callerRegionIds = new Set(
      allDistrictData
        .filter((d) => d.regionid && callerDistrictIds.has(d.DistrictId))
        .map((d) => d.regionid as string),
    );
    const regions =
      callerDistrictIds.size === 0
        ? dedupe([...regionNameFromData.entries()].map(([id, name]) => ({ id, name })))
        : dedupe(
            [...callerRegionIds]
              .filter((id) => regionNameFromData.has(id))
              .map((id) => ({ id, name: regionNameFromData.get(id) as string })),
          );

    const stateNames = this.stateNameMap();
    const states = dedupe(
      rows
        .filter((r) => r.stateId)
        .map((r) => ({
          id: r.stateId as string,
          name: stateNames.get(r.stateId as string) ?? (r.stateId as string),
        })),
    );

    // Cities come from the POSPs actually in scope
    const pospWhere = buildPospScopeWhere(scope) as Prisma.PospWhereInput;
    const posps = await this.prisma.posp.findMany({
      where: Object.keys(pospWhere).length > 0 ? pospWhere : undefined,
      select: { cityId: true },
    });
    const cityNames = this.cityNameMap();
    const cities = dedupe(
      posps
        .filter((p) => p.cityId)
        .map((p) => ({
          id: p.cityId as string,
          name: cityNames.get(p.cityId as string) ?? (p.cityId as string),
        })),
    );

    // Cascade: the level directly below the caller
    let nextLevel: string | null = null;
    let subordinates: FilterOptionItem[] = [];
    if (user.role !== Role.POSP) {
      const idx = this.nextLevelIndex(user.role);
      if (idx < LEVELS.length) {
        nextLevel = LEVELS[idx].role;
        subordinates = this.distinctLevel(rows, LEVELS[idx].role);
      } else {
        nextLevel = Role.POSP;
        subordinates = await this.pospsInDistricts(
          rows.map((r) => r.districtId),
        );
      }
    }

    return {
      callerRole: user.role,
      nextLevel,
      subordinates,
      states,
      districts,
      cities,
      dms,
      asms,
      rhs,
      zhs,
      zones,
      regions,
    };
  }

  /**
   * Drill into a specific person (identified by `level` + `code`) and return
   * the next level down, always intersected with the caller's scope so a
   * manager can never see siblings or anyone outside their territory.
   */
  async getSubordinatesByCode(
    level: LevelRole,
    code: string,
    scope: HierarchyScope,
  ): Promise<SubordinatesResult> {
    // Districts the selected person covers, intersected with caller scope.
    const ownRows = await this.prisma.districtHierarchy.findMany({
      where: this.whereForLevelCode(level, code),
      select: { districtId: true },
    });
    let districtIds = ownRows.map((r) => r.districtId);
    const scopeIds = scopeDistrictIds(scope);
    if (scopeIds !== null) {
      const allowed = new Set(scopeIds);
      districtIds = districtIds.filter((id) => allowed.has(id));
    }
    if (districtIds.length === 0) {
      return { nextLevel: null, members: [], posps: [] };
    }

    const idx = LEVELS.findIndex((l) => l.role === level);
    const childIdx = idx + 1;

    if (childIdx < LEVELS.length) {
      const rows = await this.prisma.districtHierarchy.findMany({
        where: { districtId: { in: districtIds } },
        select: DH_SELECT,
      });
      return {
        nextLevel: LEVELS[childIdx].role,
        members: this.distinctLevel(rows, LEVELS[childIdx].role),
        posps: [],
      };
    }

    // Selected node is a DM → return its POSPs.
    return {
      nextLevel: Role.POSP,
      members: [],
      posps: await this.pospsInDistricts(districtIds),
    };
  }

  private async pospsInDistricts(
    districtIds: string[],
  ): Promise<FilterOptionItem[]> {
    if (districtIds.length === 0) return [];
    const rows = await this.prisma.posp.findMany({
      where: { districtId: { in: districtIds } },
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    });
    return rows.map((p) => ({
      id: p.id,
      name: `${p.name} (${p.code})`,
      designation: Role.POSP,
    }));
  }
}

/** Deduplicates filter items by id and sorts by name. */
function dedupe(items: FilterOptionItem[]): FilterOptionItem[] {
  const seen = new Map<string, FilterOptionItem>();
  for (const it of items) if (!seen.has(it.id)) seen.set(it.id, it);
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}
