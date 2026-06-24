import { Injectable, Logger } from '@nestjs/common';
import { ExternalApiService } from '../../common/external-api/external-api.service';
import {
  scopeDistrictIds,
  type HierarchyScope,
} from '../../common/auth/hierarchy-scope.util';
import type {
  CityItem,
  DistrictItem,
  GeoCatalog,
  GeoFilterSelection,
  GeoItem,
  GeoSelection,
} from './geo.types';

/**
 * Single source of truth for geographic reference data. Builds a normalized
 * catalog from Cognitensor (snapshot/live) once and memoizes it. Small lists
 * (zones/regions/states) are served whole; big lists (districts ~726, cities
 * ~5.7k) are searched server-side so the client never downloads them in bulk.
 */
@Injectable()
export class GeoCatalogService {
  private readonly logger = new Logger(GeoCatalogService.name);

  private states: GeoItem[] | null = null;
  private zones: GeoItem[] | null = null;
  private regions: GeoItem[] | null = null;
  private districts: DistrictItem[] | null = null;
  private cities: CityItem[] | null = null;

  // Index maps for O(1) resolution.
  private districtsById = new Map<string, DistrictItem>();
  private citiesById = new Map<string, CityItem>();

  constructor(private readonly externalApi: ExternalApiService) {}

  /** Drops the cache so the next access rebuilds (called after an org sync). */
  refresh(): void {
    this.states = null;
    this.zones = null;
    this.regions = null;
    this.districts = null;
    this.cities = null;
    this.districtsById.clear();
    this.citiesById.clear();
  }

  // ── builders (lazy + memoized) ────────────────────────────────────────────

  private build(): void {
    if (this.districts && this.cities) return;
    throw new Error(
      'GeoCatalogService.build() is sync — call buildAsync() instead',
    );
  }

  private async buildAsync(): Promise<void> {
    if (this.districts && this.cities) return;

    const stateNameById = new Map<string, string>();
    this.states = (await this.externalApi.listStates()).map((s) => {
      stateNameById.set(s.StateId, s.StateName);
      return { id: s.StateId, name: s.StateName };
    });

    this.zones = (await this.externalApi.listZones()).map((z) => ({
      id: z.Zoneid,
      name: z.ZoneName,
    }));

    const regionMap = new Map<string, string>();
    this.districts = (await this.externalApi.listDistricts('')).map((d) => {
      if (d.regionid) regionMap.set(d.regionid, d.regionname ?? d.regionid);
      return {
        id: d.DistrictId,
        name: d.DistrictName,
        stateId: d.StateId ?? null,
        stateName: d.StateId ? (stateNameById.get(d.StateId) ?? null) : null,
        zoneId: d.zoneid ?? null,
        zoneName: d.zonename ?? null,
        regionId: d.regionid ?? null,
        regionName: d.regionname ?? null,
      };
    });
    this.regions = [...regionMap.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));

    this.cities = (await this.externalApi.listCities('')).map((c) => ({
      id: c.CityId,
      name: c.CityName,
      districtId: c.DistrictId ?? null,
      districtName: c.DistrictName ?? null,
      stateId: c.StateId ?? null,
      stateName: c.StateName ?? null,
    }));

    this.districtsById = new Map(this.districts.map((d) => [d.id, d]));
    this.citiesById = new Map(this.cities.map((c) => [c.id, c]));

    this.logger.log(
      `Geo catalog built: ${this.states.length} states, ${this.zones.length} zones, ${this.regions.length} regions, ${this.districts.length} districts, ${this.cities.length} cities`,
    );
  }

  private async allDistricts(): Promise<DistrictItem[]> {
    await this.buildAsync();
    return this.districts as DistrictItem[];
  }

  private async allCities(): Promise<CityItem[]> {
    await this.buildAsync();
    return this.cities as CityItem[];
  }

  /** `null` = unrestricted (all India); empty set = no territory. */
  private allowedDistrictIds(scope?: HierarchyScope): Set<string> | null {
    if (!scope) return null;
    const ids = scopeDistrictIds(scope);
    if (ids === null) return null;
    return new Set(ids);
  }

  private async scopedDistrictRows(
    scope?: HierarchyScope,
  ): Promise<DistrictItem[]> {
    const rows = await this.allDistricts();
    const allowed = this.allowedDistrictIds(scope);
    if (!allowed) return rows;
    return rows.filter((d) => allowed.has(d.id));
  }

  private async scopedCityRows(scope?: HierarchyScope): Promise<CityItem[]> {
    const rows = await this.allCities();
    const allowed = this.allowedDistrictIds(scope);
    if (!allowed) return rows;
    return rows.filter(
      (c) => c.districtId !== null && allowed.has(c.districtId),
    );
  }

  // ── public reads ──────────────────────────────────────────────────────────

  /** Small reference lists loaded whole on the client (scoped to territory). */
  async getCatalog(scope?: HierarchyScope): Promise<GeoCatalog> {
    await this.buildAsync();
    const districts = await this.scopedDistrictRows(scope);
    const zoneIds = new Set(
      districts
        .map((d) => d.zoneId)
        .filter((id): id is string => id !== null && id !== ''),
    );
    const regionIds = new Set(
      districts
        .map((d) => d.regionId)
        .filter((id): id is string => id !== null && id !== ''),
    );
    const stateIds = new Set(
      districts
        .map((d) => d.stateId)
        .filter((id): id is string => id !== null && id !== ''),
    );

    return {
      zones: (this.zones as GeoItem[]).filter((z) => zoneIds.has(z.id)),
      regions: (this.regions as GeoItem[]).filter((r) => regionIds.has(r.id)),
      states: (this.states as GeoItem[]).filter((s) => stateIds.has(s.id)),
    };
  }

  async searchDistricts(
    q: string,
    limit = 20,
    opts: {
      stateId?: string;
      zoneId?: string;
      regionId?: string;
      scope?: HierarchyScope;
    } = {},
  ): Promise<DistrictItem[]> {
    const term = q.trim().toLowerCase();
    let rows = await this.scopedDistrictRows(opts.scope);
    if (opts.stateId) rows = rows.filter((d) => d.stateId === opts.stateId);
    if (opts.zoneId) rows = rows.filter((d) => d.zoneId === opts.zoneId);
    if (opts.regionId) rows = rows.filter((d) => d.regionId === opts.regionId);
    if (term) rows = rows.filter((d) => d.name.toLowerCase().includes(term));
    return rows.slice(0, limit);
  }

  async searchCities(
    q: string,
    limit = 20,
    opts: {
      districtId?: string;
      stateId?: string;
      scope?: HierarchyScope;
    } = {},
  ): Promise<CityItem[]> {
    const term = q.trim().toLowerCase();
    let rows = await this.scopedCityRows(opts.scope);
    if (opts.districtId)
      rows = rows.filter((c) => c.districtId === opts.districtId);
    if (opts.stateId) rows = rows.filter((c) => c.stateId === opts.stateId);
    if (term) rows = rows.filter((c) => c.name.toLowerCase().includes(term));
    return rows.slice(0, limit);
  }

  /** Resolve ids back to items so the client can label selected chips. */
  async districtsByIds(
    ids: string[],
    scope?: HierarchyScope,
  ): Promise<DistrictItem[]> {
    await this.buildAsync();
    const allowed = this.allowedDistrictIds(scope);
    return ids
      .map((id) => this.districtsById.get(id))
      .filter((d): d is DistrictItem => {
        if (!d) return false;
        if (!allowed) return true;
        return allowed.has(d.id);
      });
  }

  async citiesByIds(
    ids: string[],
    scope?: HierarchyScope,
  ): Promise<CityItem[]> {
    await this.buildAsync();
    const allowed = this.allowedDistrictIds(scope);
    return ids
      .map((id) => this.citiesById.get(id))
      .filter((c): c is CityItem => {
        if (!c) return false;
        if (!allowed) return true;
        return c.districtId !== null && allowed.has(c.districtId);
      });
  }

  // ── resolution to districtIds (for scoped filtering) ──────────────────────

  /** A single geo selection -> the set of Cognitensor districtIds it covers. */
  async resolveDistrictIds(sel: GeoSelection): Promise<string[]> {
    await this.buildAsync();
    if (sel.districtId) return [sel.districtId];
    if (sel.cityId) {
      const city = this.citiesById.get(sel.cityId);
      return city?.districtId ? [city.districtId] : [];
    }
    if (sel.regionId)
      return (await this.allDistricts())
        .filter((d) => d.regionId === sel.regionId)
        .map((d) => d.id);
    if (sel.stateId)
      return (await this.allDistricts())
        .filter((d) => d.stateId === sel.stateId)
        .map((d) => d.id);
    if (sel.zoneId)
      return (await this.allDistricts())
        .filter((d) => d.zoneId === sel.zoneId)
        .map((d) => d.id);
    return [];
  }

  /**
   * Multi-value geo selection -> districtIds. Union within a dimension,
   * intersect across dimensions. Returns null when nothing geo is selected
   * (so the caller leaves the query unfiltered).
   */
  async districtIdsForQuery(q: GeoFilterSelection): Promise<string[] | null> {
    const dimensions: Array<{ key: keyof GeoSelection; values?: string[] }> = [
      { key: 'zoneId', values: q.zone },
      { key: 'regionId', values: q.region },
      { key: 'stateId', values: q.state },
      { key: 'districtId', values: q.district },
      { key: 'cityId', values: q.city },
    ];

    let result: Set<string> | null = null;
    for (const dim of dimensions) {
      if (!dim.values?.length) continue;
      const union = new Set<string>();
      for (const value of dim.values) {
        for (const id of await this.resolveDistrictIds({ [dim.key]: value })) {
          union.add(id);
        }
      }
      result =
        result === null
          ? union
          : new Set([...result].filter((id) => union.has(id)));
    }

    return result === null ? null : [...result];
  }
}
