/**
 * External RoiNet Cognitensor API Types
 * 
 * These types represent the location and hierarchy data
 * from the external RoiNet Cognitensor service.
 * 
 * IMPORTANT: All responses from the API are wrapped in:
 * { description: string, Data: T[] }
 */

/**
 * Response wrapper for all Cognitensor API calls
 */
export interface CognitensorResponse<T> {
  description: string;
  Data: T[];
}

/**
 * State data from ListState endpoint
 */
export interface State {
  StateId: string;
  StateName: string;
  StateCode: string;
}

/**
 * District data from ListDistrict endpoint
 */
export interface District {
  StateId: string;
  DistrictId: string;
  DistrictName: string;
}

/**
 * City data from ListCity endpoint
 */
export interface City {
  StateId: string;
  DistrictId: string;
  CityId: string;
  CityName: string;
}

/**
 * Hierarchy user data from ListHierarchyUserData endpoint
 * Contains district manager and up to 5 levels of reporting hierarchy
 */
export interface HierarchyUser {
  DistrictId: string;
  DistrictName: string;
  DistrictManagerId: string;
  DistrictManagerCode: string;
  DistrictManagerName: string;
  R1_UserId: string;
  R1_UserCode: string;
  R1_UserName: string;
  R2_UserId: string;
  R2_UserCode: string;
  R2_UserName: string;
  R3_UserId: string;
  R3_UserCode: string;
  R3_UserName: string;
  R4_UserId: string;
  R4_UserCode: string;
  R4_UserName: string;
  R5_UserId: string;
  R5_UserCode: string;
  R5_UserName: string;
}

/**
 * POSP data from ListPospData endpoint
 */
export interface PospData {
  UserId: string;
  UserCode: string;
  /** POSP full name from Cognitensor (`username` key). */
  username?: string;
  MobileNo: string;
  EmailId: string;
  districtid: string;
  stateid: string;
  cityid: string;
  HephGcdCode: string;
  CreatedDate: string;
  CreatedBy: string;
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
