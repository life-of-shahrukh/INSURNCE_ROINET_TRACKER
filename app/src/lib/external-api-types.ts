/**
 * External RoiNet Cognitensor API Types
 * 
 * These types represent the location and hierarchy data
 * from the external RoiNet Cognitensor service.
 */

export interface State {
  id: string;
  name: string;
  code?: string;
}

export interface District {
  id: string;
  name: string;
  stateId: string;
}

export interface City {
  id: string;
  name: string;
  districtId: string;
}

export interface HierarchyUser {
  userId: string;
  name: string;
  role: string;
  level: number;
  parentId: string | null;
}

/**
 * Request/Response types for external API
 */
export interface ListDistrictRequest {
  stateid: string;
}

export interface ListCityRequest {
  districtid: string;
}
