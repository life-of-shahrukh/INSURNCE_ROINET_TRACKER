import { ForbiddenException } from '@nestjs/common';
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
 * Resolves which data territory a user can access based on their role
 * and organizational position in the SalesTeam hierarchy.
 *
 * Rules:
 *  - SUPER_ADMIN / NATIONAL_HEAD → empty scope = all data
 *  - POSP → [user.pospId]
 *  - Every management role (ZH/RH/ASM/DM) → pospIds owned by their SalesTeam
 *    subtree. This uniform rule means each node sees itself + descendants only.
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

  // Management roles — resolve POSP ownership via the SalesTeam subtree.
  const salesTeam = await prisma.salesTeam.findUnique({
    where: { userId: user.userId },
    select: { id: true },
  });

  if (!salesTeam) {
    return { pospIds: [] }; // no salesTeam record = no access
  }

  const pospIds = await collectPospIdsForSubtree(prisma, salesTeam.id);
  return { pospIds };
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
