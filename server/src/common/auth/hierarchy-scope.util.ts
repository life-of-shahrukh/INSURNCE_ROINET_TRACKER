import { ForbiddenException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import { Role } from '../constants';
import type { AuthUser } from './auth-user.interface';

/**
 * Describes the data territory a given user is allowed to see.
 * An empty object means "all data" (SUPER_ADMIN / NATIONAL_HEAD).
 * pospIds: [] means "no data accessible" (unlinked user).
 */
export interface HierarchyScope {
  /** Zone-level access — used for ZH role */
  zoneIds?: string[];
  /** Region-level access — used for RH role */
  regionIds?: string[];
  /** Area-level access — used for ASM role */
  areaIds?: string[];
  /** District-level access — used for DM role */
  districtIds?: string[];
  /** Direct POSP-level access — POSP self, or ASM/DM with resolved list */
  pospIds?: string[];
}

/**
 * The seeded demo manager logins (zonal@/regional@/asm@/dm@roinet.com) use
 * synthetic `SalesTeam.employeeCode`s that are not part of the Cognitensor org
 * graph, so they would otherwise resolve to an empty territory (and an empty
 * org chart). We alias each placeholder code onto a real `OrgMember.userCode`
 * whose org `usertype` actually matches the demo role, all drawn from a single
 * zone (RAMANUJ / Bihar-Jharkhand) so every demo role gets a non-empty scope
 * that nests inside the one above it with a distinct size. Real accounts —
 * whose `employeeCode` already matches an `OrgMember` — never hit this map.
 * This lives in code (not seed data) so it cannot collide with the unique
 * `employeeCode` constraint and survives the weekly org-graph sync.
 *
 * Note: the org graph's lowest manager tier is ASM (usertype 4); CSP/CSF/CMF
 * (usertype 3/2/1) are field POSPs, not managers, so there is no real "DM"
 * node. The DM demo therefore borrows the smallest available ASM territory.
 */
const DEMO_EMPLOYEE_CODE_ALIASES: Record<string, string> = {
  'EMP-Z001': 'RAMANUJ.BIHARJHKZM', // Zonal Head demo → ZH  usertype 10 (~43 districts)
  'EMP-R001': 'PRABHAT.RHJKND', // Regional Head demo → RH  usertype 6  (~15 districts)
  'EMP-A001': 'RAHUL.ASMBIHAR', // ASM demo           → ASM usertype 4  (~4 districts)
  'EMP-D001': 'PRASHANTJHA.ASMBIHAR', // DM demo       → smallest ASM    (1 district)
};

/**
 * Maps a SalesTeam.employeeCode to the org-graph UserCode used for scope and
 * cascade resolution. Real accounts pass through unchanged; seeded demo logins
 * are aliased onto a real `OrgMember.userCode`.
 */
export function resolveOrgMemberCode(employeeCode: string): string {
  return DEMO_EMPLOYEE_CODE_ALIASES[employeeCode] ?? employeeCode;
}

/**
 * Collects the district ids a member (identified by their Cognitensor
 * UserCode) covers. The org graph is role-agnostic: a member covers a district
 * whenever they appear anywhere in that district's chain, recorded once per
 * (district, member) in `DistrictChain`. Because `DistrictChain` already
 * encodes transitive coverage, this is a single indexed lookup — no closure
 * walk needed for scoping.
 */
export async function districtIdsForCode(
  prisma: PrismaService,
  code: string,
): Promise<string[]> {
  if (!code) return [];

  const member = await prisma.orgMember.findFirst({
    where: { userCode: code },
    select: { id: true },
  });
  if (!member) return [];

  const rows = await prisma.districtChain.findMany({
    where: { memberId: member.id },
    select: { districtId: true },
    distinct: ['districtId'],
  });
  return rows.map((r) => r.districtId);
}

/**
 * Resolves which data territory a user can access based on their role.
 *
 * The model is geographic: every POSP belongs to a district
 * (`Posp.districtId`), and the org graph (`OrgMember` + `DistrictChain`)
 * records every district a member covers transitively. A manager's scope is
 * therefore the set of districts their `OrgMember` is linked to.
 *
 * Rules:
 *  - SUPER_ADMIN / NATIONAL_HEAD → empty scope = all data
 *  - POSP → { pospIds: [self] }
 *  - everyone else → { districtIds } resolved via OrgMember/DistrictChain
 */
export async function resolveHierarchyScope(
  user: AuthUser,
  prisma: PrismaService,
): Promise<HierarchyScope> {
  const { role } = user;

  if (role === Role.SUPER_ADMIN || role === Role.NATIONAL_HEAD) {
    return {}; // no restriction
  }

  if (role === Role.POSP) {
    if (!user.pospId)
      throw new ForbiddenException('POSP account is not linked to a profile');
    return { pospIds: [user.pospId] };
  }

  // Resolve the caller's external code, then their districts via the org graph.
  const salesTeam = await prisma.salesTeam.findUnique({
    where: { userId: user.userId },
    select: { employeeCode: true },
  });
  if (!salesTeam) {
    return { districtIds: [] }; // no salesTeam record = no access
  }

  // Real accounts resolve directly; seeded demo accounts fall back to an alias.
  const code = resolveOrgMemberCode(salesTeam.employeeCode);
  const districtIds = await districtIdsForCode(prisma, code);
  return { districtIds };
}

/**
 * Returns the explicit district id list a scope covers, or `null` for an
 * unrestricted scope (SUPER_ADMIN / NATIONAL_HEAD). A non-district scope
 * (e.g. POSP) returns `[]` (no manager-level territory).
 */
export function scopeDistrictIds(scope: HierarchyScope): string[] | null {
  if (!scope || Object.keys(scope).length === 0) return null;
  if (scope.districtIds) return scope.districtIds;
  return [];
}

/**
 * Converts a HierarchyScope into a Prisma-compatible `where` clause fragment
 * for Lead queries (uses pospId for POSP, geography columns for managers).
 */
export function buildLeadScopeWhere(
  scope: HierarchyScope,
): Record<string, unknown> {
  if (!scope || Object.keys(scope).length === 0) return {};

  if (scope.pospIds !== undefined) {
    return { pospId: { in: scope.pospIds } };
  }
  if (scope.districtIds) {
    return { districtId: { in: scope.districtIds } };
  }
  if (scope.areaIds) {
    return { areaId: { in: scope.areaIds } };
  }
  if (scope.regionIds) {
    return { regionId: { in: scope.regionIds } };
  }
  if (scope.zoneIds) {
    return { zoneId: { in: scope.zoneIds } };
  }
  return {};
}

/**
 * Converts a HierarchyScope into a Prisma-compatible `where` clause fragment
 * for Deal / Lead queries that carry denormalized hierarchy columns.
 *
 * For Posp queries, use `buildPospScopeWhere` instead.
 */
export function buildDealScopeWhere(
  scope: HierarchyScope,
): Record<string, unknown> {
  if (!scope || Object.keys(scope).length === 0) return {};

  if (scope.pospIds !== undefined) {
    return { pospId: { in: scope.pospIds } };
  }
  if (scope.districtIds) {
    return { districtId: { in: scope.districtIds } };
  }
  if (scope.areaIds) {
    return { areaId: { in: scope.areaIds } };
  }
  if (scope.regionIds) {
    return { regionId: { in: scope.regionIds } };
  }
  if (scope.zoneIds) {
    return { zoneId: { in: scope.zoneIds } };
  }
  return {};
}

/**
 * Converts a HierarchyScope into a `where` clause for Posp queries.
 */
/**
 * Customers are linked to territory via related deals/leads (and optionally
 * denormalized `districtId` on the customer row).
 */
export function buildCustomerScopeWhere(
  scope: HierarchyScope,
): Prisma.CustomerWhereInput {
  if (!scope || Object.keys(scope).length === 0) return {};

  const orClauses: Prisma.CustomerWhereInput[] = [];

  const dealScope = buildDealScopeWhere(scope);
  if (Object.keys(dealScope).length > 0) {
    orClauses.push({
      deals: { some: dealScope },
    });
  }

  const leadScope = buildLeadScopeWhere(scope);
  if (Object.keys(leadScope).length > 0) {
    orClauses.push({
      leads: { some: leadScope },
    });
  }

  if (scope.districtIds?.length) {
    orClauses.push({ districtId: { in: scope.districtIds } });
  }

  if (orClauses.length === 0) return {};
  if (orClauses.length === 1) return orClauses[0];
  return { OR: orClauses };
}

export function buildPospScopeWhere(
  scope: HierarchyScope,
): Record<string, unknown> {
  if (!scope || Object.keys(scope).length === 0) return {};

  if (scope.pospIds !== undefined) {
    return { id: { in: scope.pospIds } };
  }
  if (scope.districtIds) {
    return { districtId: { in: scope.districtIds } };
  }
  if (scope.areaIds) {
    return { areaId: { in: scope.areaIds } };
  }
  if (scope.regionIds) {
    return { regionId: { in: scope.regionIds } };
  }
  if (scope.zoneIds) {
    return { zoneId: { in: scope.zoneIds } };
  }
  return {};
}
