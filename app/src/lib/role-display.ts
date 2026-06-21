import type { UserRole } from "@/lib/auth-types";

/**
 * All display labels (see server/data/reference/user-type.txt).
 *
 * Org roles (SZH, CH, RH, …) are the **exact** Cognitensor designation.
 * App roles (ZH, RH, ASM, DM, …) are CRM auth buckets — same label when
 * org role matches (e.g. RH → Regional Head), but CH/SZH need `orgRole`
 * to distinguish from the shared app bucket.
 *
 * Always use `userDisplayRole()` / `displayRoleLabel()` — not APP_ROLE_LABELS alone.
 */

/** Full label map: org roles + CRM auth roles. */
export const ROLE_LABELS: Record<string, string> = {
  // Org roles (Cognitensor usertype)
  ADMIN: "Admin",
  NATIONAL_HEAD: "National Head",
  SZH: "Super Zonal Head",
  ZH: "Zonal Head",
  CH: "Cluster Head",
  RH: "Regional Head",
  ASSISTASM: "Assistant Area Sales Manager",
  ASM: "Area Sales Manager",
  CSP: "CSP",
  CSF: "CSF",
  CMF: "CMF",
  POSP: "POSP Agent",
  UNKNOWN: "Other",
  // CRM-only auth roles
  SUPER_ADMIN: "Super Admin",
  DM: "District Manager",
};

/** Org-role codes only (mirrors server ORG_ROLE_LABELS). */
export const ORG_ROLE_LABELS: Record<string, string> = {
  ADMIN: ROLE_LABELS.ADMIN,
  NATIONAL_HEAD: ROLE_LABELS.NATIONAL_HEAD,
  SZH: ROLE_LABELS.SZH,
  ZH: ROLE_LABELS.ZH,
  CH: ROLE_LABELS.CH,
  RH: ROLE_LABELS.RH,
  ASSISTASM: ROLE_LABELS.ASSISTASM,
  ASM: ROLE_LABELS.ASM,
  CSP: ROLE_LABELS.CSP,
  CSF: ROLE_LABELS.CSF,
  CMF: ROLE_LABELS.CMF,
  POSP: ROLE_LABELS.POSP,
  UNKNOWN: ROLE_LABELS.UNKNOWN,
};

/** CRM auth buckets — fallback only when org designation is unknown. */
export const APP_ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: ROLE_LABELS.SUPER_ADMIN,
  NATIONAL_HEAD: ROLE_LABELS.NATIONAL_HEAD,
  ZH: ROLE_LABELS.ZH,
  RH: ROLE_LABELS.RH,
  ASM: ROLE_LABELS.ASM,
  DM: ROLE_LABELS.DM,
  POSP: ROLE_LABELS.POSP,
};

export interface RoleDisplayInput {
  role: UserRole | string;
  orgRole?: string | null;
  roleLabel?: string | null;
}

export function orgRoleLabel(orgRole: string): string {
  return ORG_ROLE_LABELS[orgRole] ?? ROLE_LABELS[orgRole] ?? orgRole;
}

/** Exact label for session user — prefers server `roleLabel`, then org role, then app bucket. */
export function userDisplayRole(input: RoleDisplayInput): string {
  if (input.roleLabel) return input.roleLabel;
  return displayRoleLabel(input.role, input.orgRole);
}

/** Prefer org designation (CH, SZH, …) over coarse app RBAC role (RH, ZH, …). */
export function displayRoleLabel(
  appRole: UserRole | string,
  orgRole?: string | null,
): string {
  if (orgRole) {
    const exact = ORG_ROLE_LABELS[orgRole] ?? ROLE_LABELS[orgRole];
    if (exact) return exact;
  }
  return APP_ROLE_LABELS[appRole as UserRole] ?? ROLE_LABELS[appRole] ?? String(appRole);
}
