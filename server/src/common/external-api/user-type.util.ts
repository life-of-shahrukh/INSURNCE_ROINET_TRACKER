/**
 * Cognitensor `usertype` -> org role mapping.
 *
 * Role in ListHierarchyUserData is defined by `usertype`, NOT by chain column
 * position (the same person sits at different R-levels across districts). These
 * labels are the *org-graph* role and are intentionally kept separate from the
 * app auth `Role` enum — login/RBAC keeps the auth role, the org chart and
 * dashboard rollups use the org label resolved here.
 *
 * Source: api-responses/user-type.txt
 */

/** Org role labels derived from Cognitensor usertype. */
export const OrgRole = {
  ADMIN: 'ADMIN', // 0 — top admin (VIVEK)
  NATIONAL_HEAD: 'NATIONAL_HEAD', // 0 below Admin (e.g. HARI.DUTT)
  CMF: 'CMF', // 1
  CSF: 'CSF', // 2
  CSP: 'CSP', // 3
  ASM: 'ASM', // 4
  RH: 'RH', // 6
  ZH: 'ZH', // 10
  ASSISTASM: 'ASSISTASM', // 11
  CH: 'CH', // 12
  SZH: 'SZH', // 14
  UNKNOWN: 'UNKNOWN',
} as const;
export type OrgRole = (typeof OrgRole)[keyof typeof OrgRole];

/** Cognitensor user code that always displays as Admin (usertype 0 special case). */
export const VIVEK_USER_CODE = 'VIVEK';

const USERTYPE_TO_ORG_ROLE: Record<number, OrgRole> = {
  0: OrgRole.ADMIN,
  1: OrgRole.CMF,
  2: OrgRole.CSF,
  3: OrgRole.CSP,
  4: OrgRole.ASM,
  6: OrgRole.RH,
  10: OrgRole.ZH,
  11: OrgRole.ASSISTASM,
  12: OrgRole.CH,
  14: OrgRole.SZH,
};

/**
 * Approximate rank (higher = more senior) used only to order the org chart and
 * pick a representative role among heterogeneous siblings. Not an access check.
 */
const ORG_ROLE_RANK: Record<OrgRole, number> = {
  ADMIN: 100,
  NATIONAL_HEAD: 95,
  SZH: 90,
  ZH: 80,
  CH: 70,
  RH: 60,
  ASSISTASM: 45,
  ASM: 40,
  CSF: 30,
  CMF: 25,
  CSP: 20,
  UNKNOWN: 0,
};

/** Human-readable display labels per org role (from user-type.txt). */
const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  ADMIN: 'Admin',
  NATIONAL_HEAD: 'National Head',
  SZH: 'Super Zonal Head',
  ZH: 'Zonal Head',
  CH: 'Cluster Head',
  RH: 'Regional Head',
  ASSISTASM: 'Assistant Area Sales Manager',
  ASM: 'Area Sales Manager',
  CSP: 'CSP',
  CSF: 'CSF',
  CMF: 'CMF',
  UNKNOWN: 'Other',
};

/** App auth Role bucket each org role maps onto (best-effort, for UI grouping). */
const ORG_ROLE_TO_APP_ROLE: Record<OrgRole, string> = {
  ADMIN: 'NATIONAL_HEAD',
  NATIONAL_HEAD: 'NATIONAL_HEAD',
  SZH: 'ZH',
  ZH: 'ZH',
  CH: 'RH',
  RH: 'RH',
  ASSISTASM: 'ASM',
  ASM: 'ASM',
  CSP: 'DM',
  CSF: 'DM',
  CMF: 'DM',
  UNKNOWN: 'DM',
};

/** Parse a raw `usertype` string/number into an OrgRole label. */
export function orgRoleFromUserType(
  userType: string | number | null | undefined,
): OrgRole {
  if (userType === null || userType === undefined || userType === '') {
    return OrgRole.UNKNOWN;
  }
  const n = typeof userType === 'number' ? userType : Number(userType);
  if (!Number.isFinite(n)) return OrgRole.UNKNOWN;
  return USERTYPE_TO_ORG_ROLE[n] ?? OrgRole.UNKNOWN;
}

/** Parse a raw `usertype` into an integer, or null if absent/invalid. */
export function parseUserType(
  userType: string | number | null | undefined,
): number | null {
  if (userType === null || userType === undefined || userType === '') {
    return null;
  }
  const n = typeof userType === 'number' ? userType : Number(userType);
  return Number.isFinite(n) ? n : null;
}

export function orgRoleRank(role: OrgRole): number {
  return ORG_ROLE_RANK[role] ?? 0;
}

/** Keep the more senior org role when a user appears in multiple chain slots. */
export function mergeOrgRole(existing: OrgRole, incoming: OrgRole): OrgRole {
  return orgRoleRank(incoming) > orgRoleRank(existing) ? incoming : existing;
}

export interface RoleMemberRef {
  userId: string;
  userCode: string;
  role: string;
}

export interface RoleEdgeRef {
  memberUserId: string;
  managerUserId: string;
}

/**
 * Splits usertype-0 ADMIN into Admin (VIVEK) vs National Head (reports to Admin).
 * Mutates roles in place and returns the same array for chaining.
 */
export function refineAdminRoles<T extends RoleMemberRef>(
  members: T[],
  edges: RoleEdgeRef[],
): T[] {
  const roleByUserId = new Map<string, string>();
  for (const m of members) {
    if (m.userCode.toUpperCase() === VIVEK_USER_CODE) {
      m.role = OrgRole.ADMIN;
    }
    roleByUserId.set(m.userId, m.role);
  }

  const parentsOf = new Map<string, Set<string>>();
  for (const e of edges) {
    if (!parentsOf.has(e.memberUserId)) {
      parentsOf.set(e.memberUserId, new Set());
    }
    parentsOf.get(e.memberUserId)?.add(e.managerUserId);
  }

  for (const m of members) {
    if (m.userCode.toUpperCase() === VIVEK_USER_CODE) continue;
    if (m.role !== OrgRole.ADMIN) continue;

    const parents = parentsOf.get(m.userId) ?? new Set<string>();
    const hasAdminParent = [...parents].some(
      (parentId) => roleByUserId.get(parentId) === OrgRole.ADMIN,
    );
    if (hasAdminParent) {
      m.role = OrgRole.NATIONAL_HEAD;
      roleByUserId.set(m.userId, OrgRole.NATIONAL_HEAD);
    }
  }

  return members;
}

export function appRoleFromOrgRole(role: OrgRole): string {
  return ORG_ROLE_TO_APP_ROLE[role] ?? 'DM';
}

/** Human-readable display label for an org role. */
export function orgRoleLabel(role: string): string {
  return ORG_ROLE_LABELS[role as OrgRole] ?? role;
}
