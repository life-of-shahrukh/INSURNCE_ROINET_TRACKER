import { ForbiddenException } from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';
import { Role } from '../constants';
import type { AuthUser } from './auth-user.interface';
import type { HierarchyResolverService } from '../external-api/hierarchy-resolver.service';

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
 * Walks the SalesTeam hierarchy (`managerId` tree) starting at `rootId` and
 * returns the root plus every descendant SalesTeam id.
 *
 * This is the single source of truth for "who is under me". Resolving POSP
 * ownership against this subtree guarantees every role sees exactly itself
 * and its lower hierarchy — no cross-level leakage, no collisions.
 */
export async function collectSalesTeamSubtree(
  prisma: PrismaService,
  rootId: string,
): Promise<string[]> {
  const all: string[] = [rootId];
  let frontier: string[] = [rootId];

  // Breadth-first; bounded by hierarchy depth (5–6 levels max).
  while (frontier.length > 0) {
    const children = await prisma.salesTeam.findMany({
      where: { managerId: { in: frontier } },
      select: { id: true },
    });
    const childIds = children.map((c) => c.id);
    if (childIds.length === 0) break;
    all.push(...childIds);
    frontier = childIds;
  }

  return all;
}

/**
 * Returns the ids of every POSP owned by any SalesTeam member in the subtree
 * rooted at `rootSalesTeamId`. POSP ownership is the `asmId` foreign key
 * (the directly-managing SalesTeam member — a DM, or an ASM with no DM layer).
 */
export async function collectPospIdsForSubtree(
  prisma: PrismaService,
  rootSalesTeamId: string,
): Promise<string[]> {
  const subtreeIds = await collectSalesTeamSubtree(prisma, rootSalesTeamId);
  const posps = await prisma.posp.findMany({
    where: { asmId: { in: subtreeIds } },
    select: { id: true },
  });
  return posps.map((p) => p.id);
}

/**
 * Maps a management role to the DistrictHierarchy column that holds that
 * role's code. A manager covers every district where their code appears in
 * the matching column. SUPER_ADMIN / NATIONAL_HEAD are unrestricted (handled
 * separately) and POSP is resolved by its own id.
 */
const ROLE_TO_DISTRICT_COLUMN: Partial<Record<Role, string>> = {
  [Role.ZH]: 'zhCode',
  [Role.RH]: 'rhCode',
  [Role.ASM]: 'asmCode',
  [Role.DM]: 'dmCode',
};

/**
 * Collects the district ids a manager (identified by their external code)
 * covers at a given level.
 */
export async function districtIdsForCode(
  prisma: PrismaService,
  column: string,
  code: string,
): Promise<string[]> {
  const rows = await prisma.districtHierarchy.findMany({
    where: { [column]: code },
    select: { districtId: true },
  });
  return rows.map((r) => r.districtId);
}

/**
 * Resolves which data territory a user can access based on their role.
 *
 * Resolution priority:
 *  1. SUPER_ADMIN / NATIONAL_HEAD → empty scope = all data
 *  2. POSP → { pospIds: [self] }
 *  3. Manager roles (ZH/RH/ASM/DM) → use HierarchyResolverService (live API + DB fallback)
 *     if provided, otherwise fall back to direct DistrictHierarchy DB lookup.
 *
 * The `hierarchyResolver` parameter is optional for backward compatibility
 * (e.g. callers that only have PrismaService available).
 */
export async function resolveHierarchyScope(
  user: AuthUser,
  prisma: PrismaService,
  hierarchyResolver?: HierarchyResolverService,
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

  // Manager roles: look up their employeeCode in SalesTeam, then resolve territory
  const salesTeam = await prisma.salesTeam.findUnique({
    where: { userId: user.userId },
    select: { employeeCode: true },
  });
  if (!salesTeam) {
    return { districtIds: [] }; // no salesTeam record = no access
  }

  // Use HierarchyResolverService (live API + cache + DB fallback) when available
  if (hierarchyResolver) {
    return hierarchyResolver.resolveManagerScope(salesTeam.employeeCode, role);
  }

  // Fallback: direct DB lookup (kept for backward compat / non-interceptor callers)
  const column = ROLE_TO_DISTRICT_COLUMN[role];
  if (!column) return { districtIds: [] };

  const districtIds = await districtIdsForCode(
    prisma,
    column,
    salesTeam.employeeCode,
  );
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
 * for Lead queries (uses geography columns, not pospId).
 */
export function buildLeadScopeWhere(
  scope: HierarchyScope,
): Record<string, unknown> {
  if (!scope || Object.keys(scope).length === 0) return {};

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
  // pospIds scope does not map directly to Lead — geography handled above
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
