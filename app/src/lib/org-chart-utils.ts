import type { OrgNode } from "@/lib/api/sales-team-api";
import type { UserRole } from "@/lib/auth-types";

/** Map app roles to org designation when employeeCode lookup fails. */
const ROLE_TO_DESIGNATION: Record<string, string> = {
  NATIONAL_HEAD: "NATIONAL_HEAD",
  ZH: "ZH",
  RH: "RH",
  ASM: "ASM",
  DM: "CSP",
  POSP: "POSP",
};

/** `hari.dutt@roinet.in` → `HARI.DUTT` for @roinet.in hierarchy logins. */
export function employeeCodeFromEmail(email: string | undefined): string | undefined {
  if (!email) return undefined;
  const local = email.split("@")[0];
  if (!local || !email.toLowerCase().endsWith("@roinet.in")) return undefined;
  return local.toUpperCase();
}

export function resolveCurrentUserNodeId(
  nodes: OrgNode[],
  employeeCode: string | undefined,
  role: string,
  email?: string,
): string | undefined {
  const codes = [employeeCode, employeeCodeFromEmail(email)].filter(
    (c): c is string => Boolean(c),
  );

  for (const code of codes) {
    const match = nodes.find(
      (n) => n.employeeCode.toLowerCase() === code.toLowerCase(),
    );
    if (match) return match.id;
  }

  const designation = ROLE_TO_DESIGNATION[role];
  if (designation) {
    const match = nodes.find((n) => n.designation === designation);
    if (match) return match.id;
  }

  return undefined;
}

/** VIVEK sees the full expanded tree; everyone else lands on their own card. */
export function shouldFocusOrgChartOnLogin(
  role: UserRole | undefined,
  employeeCode?: string,
): boolean {
  if (!role) return false;
  if (role === "SUPER_ADMIN") return false;
  if (employeeCode?.toUpperCase() === "VIVEK") return false;
  return true;
}
