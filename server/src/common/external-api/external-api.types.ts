import type { Role } from '../constants';

/**
 * External usertype values from Cognitensor ListHierarchyUserData.
 * UserType 1 (CMF) and 2 (CSF) have no login access and are excluded from all
 * analytics — they must not appear in any role mapping or scope resolution.
 */
export const ExternalUserType = {
  ADMIN: 0,
  CSP: 3, // POSP login path (isPosp=true via ListPospData)
  ASM: 4, // Manager login (isPosp=false)
  RH: 6, // Manager login
  ZH: 10, // Manager login
  ASSISTASM: 11, // Manager login — same scope as ASM
  CH: 12, // Manager login — Cluster Head, multiple districts
  SZH: 14, // Manager login — Super Zonal Head
} as const;
export type ExternalUserType =
  (typeof ExternalUserType)[keyof typeof ExternalUserType];

/**
 * Maps a Cognitensor usertype number to the internal Role string constant.
 * Returns undefined for unhandled types (CMF=1, CSF=2) which should be ignored.
 */
export function externalUserTypeToRole(usertype: number): Role | undefined {
  switch (usertype) {
    case ExternalUserType.ADMIN:
      return 'SUPER_ADMIN';
    case ExternalUserType.SZH:
      return 'NATIONAL_HEAD';
    case ExternalUserType.ZH:
      return 'ZH';
    case ExternalUserType.RH:
      return 'RH';
    case ExternalUserType.ASM:
    case ExternalUserType.ASSISTASM:
      return 'ASM';
    case ExternalUserType.CH:
      return 'DM';
    default:
      return undefined;
  }
}

/**
 * Maps a Cognitensor usertype number to the DistrictHierarchy column
 * that stores this role's code (used for DB-based scope resolution fallback).
 */
export function externalUserTypeToHierarchyColumn(
  usertype: number,
): string | undefined {
  switch (usertype) {
    case ExternalUserType.SZH:
      return 'nhCode';
    case ExternalUserType.ZH:
      return 'zhCode';
    case ExternalUserType.RH:
      return 'rhCode';
    case ExternalUserType.ASM:
    case ExternalUserType.ASSISTASM:
      return 'asmCode';
    case ExternalUserType.CH:
      return 'dmCode';
    default:
      return undefined;
  }
}

/**
 * Resolved identity for a manager logging in via SSO.
 * Returned by ExternalApiService.getManagerIdentity().
 */
export interface ManagerIdentity {
  userId: string;
  userCode: string;
  userName: string;
  usertype: number;
  role: Role;
  /** All districtIds where this manager appears in the hierarchy chain */
  districtIds: string[];
}

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
  /** POSP full name from Cognitensor (ListPospData `username` key). */
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
