/** Raw wrapper returned by every Cognitensor endpoint */
export interface CognitensorResponse<T> {
  description: string;
  Data: T[];
}

export interface ExternalState {
  StateId: string;
  StateName: string;
  StateCode: string;
}

export interface ExternalDistrict {
  StateId: string;
  DistrictId: string;
  DistrictName: string;
  /** Region/zone are optional so older snapshots without them still parse. */
  regionid?: string;
  regionname?: string;
  zoneid?: string;
  zonename?: string;
}

export interface ExternalZone {
  Zoneid: string;
  ZoneName: string;
}

export interface ExternalCity {
  StateId: string;
  StateName: string;
  DistrictId: string;
  DistrictName: string;
  CityId: string;
  CityName: string;
}

/**
 * Shape returned by Cognitensor ListPospData. Geography is now first-class:
 * `districtid`/`stateid`/`cityid` replace the old `ResidenceState`/`ResidenceCity`/
 * `CompanyState`/`CompanyCity` name fields, so no name-to-ID mapping is needed.
 */
export interface ExternalPospData {
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

/** ListPospData login lookup returns the same shape as the admin list. */
export type ExternalPospLoginData = ExternalPospData;

/**
 * A district chain from ListHierarchyUserData. The district owner is the
 * DistrictManager (its role is given by the top-level `usertype`), followed by
 * a variable-length upline R1..R7 each carrying its own `R{n}_usertype`.
 * Role is defined by `usertype`, NOT by column position — the same person can
 * appear at different R-levels across districts.
 */
export interface ExternalHierarchyUser {
  DistrictId: string;
  DistrictName: string;
  DistrictManagerId: string;
  DistrictManagerCode: string;
  DistrictManagerName: string;
  /** usertype of the district owner (DistrictManager). */
  usertype?: string;
  R1_UserId: string;
  R1_UserCode: string;
  R1_UserName: string;
  R1_usertype?: string;
  R2_UserId: string;
  R2_UserCode: string;
  R2_UserName: string;
  R2_usertype?: string;
  R3_UserId: string;
  R3_UserCode: string;
  R3_UserName: string;
  R3_usertype?: string;
  R4_UserId: string;
  R4_UserCode: string;
  R4_UserName: string;
  R4_usertype?: string;
  R5_UserId: string;
  R5_UserCode: string;
  R5_UserName: string;
  R5_usertype?: string;
  R6_UserId?: string;
  R6_UserCode?: string;
  R6_UserName?: string;
  R6_usertype?: string;
  R7_UserId?: string;
  R7_UserCode?: string;
  R7_UserName?: string;
  R7_usertype?: string;
}
