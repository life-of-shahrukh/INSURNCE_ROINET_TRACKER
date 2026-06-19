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
 * Zone data from ListZone endpoint (9 zones covering all of India)
 */
export interface Zone {
  Zoneid: string;
  ZoneName: string;
}

/**
 * District data from ListDistrict endpoint.
 * Now includes region and zone enrichment.
 */
export interface District {
  StateId: string;
  DistrictId: string;
  DistrictName: string;
  /** Region id — returned by updated ListDistrict */
  regionid?: string;
  /** Region name — returned by updated ListDistrict */
  regionname?: string;
  /** Zone id — returned by updated ListDistrict */
  zoneid?: string;
  /** Zone name — returned by updated ListDistrict */
  zonename?: string;
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
 * Contains district manager and up to 7 levels of reporting hierarchy.
 * The `usertype` fields identify the role (CH=12, ASM=4/11, RH=6, ZH=10, SZH=14).
 */
export interface HierarchyUser {
  DistrictId: string;
  DistrictName: string;
  DistrictManagerId: string;
  DistrictManagerCode: string;
  DistrictManagerName: string;
  usertype: string;
  R1_UserId: string;
  R1_UserCode: string;
  R1_UserName: string;
  R1_usertype: string;
  R2_UserId: string;
  R2_UserCode: string;
  R2_UserName: string;
  R2_usertype: string;
  R3_UserId: string;
  R3_UserCode: string;
  R3_UserName: string;
  R3_usertype: string;
  R4_UserId: string;
  R4_UserCode: string;
  R4_UserName: string;
  R4_usertype: string;
  R5_UserId: string;
  R5_UserCode: string;
  R5_UserName: string;
  R5_usertype: string;
}

/**
 * POSP data from ListPospData endpoint
 */
export interface PospData {
  UserId: string;
  UserCode: string;
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
