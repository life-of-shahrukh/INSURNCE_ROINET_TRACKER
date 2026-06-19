import { request } from "./fetch-client";

export interface GeoItem {
  id: string;
  name: string;
}

export interface DistrictItem {
  id: string;
  name: string;
  stateId: string | null;
  stateName: string | null;
  zoneId: string | null;
  zoneName: string | null;
  regionId: string | null;
  regionName: string | null;
}

export interface CityItem {
  id: string;
  name: string;
  districtId: string | null;
  districtName: string | null;
  stateId: string | null;
  stateName: string | null;
}

/** Small reference lists loaded whole on the client. */
export interface GeoCatalog {
  zones: GeoItem[];
  regions: GeoItem[];
  states: GeoItem[];
}

export interface MemberItem {
  id: string;
  name: string;
  designation?: string;
}

export const EMPTY_GEO_CATALOG: GeoCatalog = {
  zones: [],
  regions: [],
  states: [],
};

function buildSearchParams(
  q: string,
  opts: Record<string, string | undefined>,
  limit = 20,
): string {
  const params = new URLSearchParams({ q, limit: String(limit) });
  for (const [key, value] of Object.entries(opts)) {
    if (value) params.set(key, value);
  }
  return params.toString();
}

export const geoCatalogApi = {
  /** Small zone/region/state reference lists (loaded once, cached forever). */
  getCatalog(): Promise<GeoCatalog> {
    return request<GeoCatalog>("/api/geo/catalog");
  },

  /** Server-side district typeahead (optionally narrowed by state/zone/region). */
  searchDistricts(
    q: string,
    opts: { stateId?: string; zoneId?: string; regionId?: string } = {},
    limit = 20,
  ): Promise<DistrictItem[]> {
    return request<DistrictItem[]>(
      `/api/geo/districts/search?${buildSearchParams(q, opts, limit)}`,
    );
  },

  /** Server-side city typeahead (optionally narrowed by district/state). */
  searchCities(
    q: string,
    opts: { districtId?: string; stateId?: string } = {},
    limit = 20,
  ): Promise<CityItem[]> {
    return request<CityItem[]>(
      `/api/geo/cities/search?${buildSearchParams(q, opts, limit)}`,
    );
  },

  districtsByIds(ids: string[]): Promise<DistrictItem[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return request<DistrictItem[]>(
      `/api/geo/districts/by-ids?ids=${encodeURIComponent(ids.join(","))}`,
    );
  },

  citiesByIds(ids: string[]): Promise<CityItem[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return request<CityItem[]>(
      `/api/geo/cities/by-ids?ids=${encodeURIComponent(ids.join(","))}`,
    );
  },

  /** Scoped member/user typeahead by name or code (optionally by org role). */
  searchMembers(
    q: string,
    opts: { role?: string } = {},
    limit = 20,
  ): Promise<MemberItem[]> {
    return request<MemberItem[]>(
      `/api/hierarchy/members/search?${buildSearchParams(q, opts, limit)}`,
    );
  },
};
