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
}

export interface ExternalCity {
  StateId: string;
  StateName: string;
  DistrictId: string;
  DistrictName: string;
  CityId: string;
  CityName: string;
}

export interface ExternalPospData {
  UserId: string;
  UserCode: string;
  MobileNo: string;
  EmailId: string;
  ResidenceState: string;
  ResidenceCity: string;
  CompanyState: string;
  CompanyCity: string;
  HephGcdCode: string;
  CreatedDate: string;
  CreatedBy: string;
}

/**
 * Shape returned by ListPospData when filtering by UserCode for SSO login.
 * Fields differ from ExternalPospData (which is used for the paginated admin list).
 */
export interface ExternalPospLoginData {
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

export interface ExternalHierarchyUser {
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
