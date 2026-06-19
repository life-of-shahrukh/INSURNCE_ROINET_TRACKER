import type { UserRole } from "@/lib/auth-types";
import { ROLE_RANK } from "@/lib/auth-types";

/** Geo / people dimensions ordered senior → granular. */
export type GeoFilterKey = "zone" | "region" | "state" | "district" | "city" | "posp";

export const GEO_FILTER_ORDER: GeoFilterKey[] = [
  "zone",
  "region",
  "state",
  "district",
  "city",
  "posp",
];

/** Org-graph role labels → app auth role bucket (mirrors server user-type.util). */
const ORG_ROLE_TO_APP_ROLE: Record<string, UserRole> = {
  ADMIN: "NATIONAL_HEAD",
  NATIONAL_HEAD: "NATIONAL_HEAD",
  SZH: "ZH",
  ZH: "ZH",
  CH: "RH",
  RH: "RH",
  ASSISTASM: "ASM",
  ASM: "ASM",
  CSP: "DM",
  CSF: "DM",
  CMF: "DM",
  UNKNOWN: "DM",
};

function appRoleFromOrgRole(orgRole: string): UserRole {
  return ORG_ROLE_TO_APP_ROLE[orgRole] ?? "DM";
}

/** First geo filter a role may use (parent levels are already fixed by scope). */
export function firstGeoFilterForRole(role: UserRole): GeoFilterKey | null {
  switch (role) {
    case "SUPER_ADMIN":
    case "NATIONAL_HEAD":
      return "zone";
    case "ZH":
      return "region";
    case "RH":
      return "state";
    case "ASM":
    case "DM":
      return "district";
    case "POSP":
      return null;
    default:
      return null;
  }
}

/** True when `key` is at or below the caller's geo filter floor. */
export function isGeoFilterVisible(role: UserRole, key: GeoFilterKey): boolean {
  const first = firstGeoFilterForRole(role);
  if (!first) return false;
  const firstIdx = GEO_FILTER_ORDER.indexOf(first);
  const keyIdx = GEO_FILTER_ORDER.indexOf(key);
  return keyIdx >= firstIdx;
}

/** Role-group dropdowns only list org roles strictly below the caller. */
export function isManagerRoleGroupVisible(
  callerRole: UserRole,
  groupRole: string,
): boolean {
  const callerRank = ROLE_RANK[callerRole];
  const groupAppRole = appRoleFromOrgRole(groupRole);
  return ROLE_RANK[groupAppRole] < callerRank;
}
