/** Normalized geo reference shapes served to the frontend / used for resolution. */

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

/** Small reference lists loaded fully on the client (zones/regions/states). */
export interface GeoCatalog {
  zones: GeoItem[];
  regions: GeoItem[];
  states: GeoItem[];
}

/** A single geo selection used to resolve a district set (dashboard scope bar). */
export interface GeoSelection {
  zoneId?: string;
  regionId?: string;
  stateId?: string;
  districtId?: string;
  cityId?: string;
}

/** Multi-value geo selection used by list-page filters. */
export interface GeoFilterSelection {
  zone?: string[];
  region?: string[];
  state?: string[];
  district?: string[];
  city?: string[];
}
