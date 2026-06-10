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
 * Resolves which data territory a user can access based on their role
 * and organizational position in the SalesTeam hierarchy.
 *
 * Rules:
 *  - SUPER_ADMIN / NATIONAL_HEAD → empty scope = all data
 *  - ZH  → zoneIds from their SalesTeam record
 *  - RH  → regionIds from their SalesTeam record
 *  - ASM → pospIds of all Posps where asmId = salesTeam.id
 *  - DM  → pospIds of all Posps in their areaId (or directly under asmId)
 *  - POSP → [user.pospId]
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

  // Management roles — need to look up their SalesTeam record
  const salesTeam = await prisma.salesTeam.findUnique({
    where: { userId: user.userId },
    select: { id: true, zoneId: true, regionId: true, areaId: true },
  });

  if (!salesTeam) {
    return { pospIds: [] }; // no salesTeam record = no access
  }

  switch (role) {
    case Role.ZH:
      return { zoneIds: salesTeam.zoneId ? [salesTeam.zoneId] : [] };

    case Role.RH:
      return { regionIds: salesTeam.regionId ? [salesTeam.regionId] : [] };

    case Role.ASM: {
      const posps = await prisma.posp.findMany({
        where: { asmId: salesTeam.id },
        select: { id: true },
      });
      return { pospIds: posps.map((p) => p.id) };
    }

    case Role.DM: {
      const where = salesTeam.areaId
        ? { areaId: salesTeam.areaId }
        : { asmId: salesTeam.id }; // fallback: POSPs directly under this DM's ASM record
      const posps = await prisma.posp.findMany({ where, select: { id: true } });
      return { pospIds: posps.map((p) => p.id) };
    }

    default:
      return { pospIds: [] };
  }
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
