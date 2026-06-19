import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ExternalApiService } from './external-api.service';
import {
  externalUserTypeToHierarchyColumn,
  externalUserTypeToRole,
  ExternalUserType,
} from './external-api.types';
import { Role } from '../constants';
import type { HierarchyScope } from '../auth/hierarchy-scope.util';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  scope: HierarchyScope;
  expiresAt: number;
}

/**
 * Resolves a manager's HierarchyScope using a two-tier strategy:
 *  1. Live Cognitensor ListHierarchyUserData call (filtered by employeeCode)
 *  2. Fallback to DistrictHierarchy DB cache if API is unavailable
 *
 * Results are cached in-memory per employeeCode for 5 minutes to avoid
 * calling the external API on every request while staying reasonably fresh.
 */
@Injectable()
export class HierarchyResolverService {
  private readonly logger = new Logger(HierarchyResolverService.name);
  private readonly cache = new Map<string, CacheEntry>();

  constructor(
    private readonly externalApi: ExternalApiService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Resolves the HierarchyScope for the given employeeCode (manager's userCode).
   *
   * SUPER_ADMIN and NATIONAL_HEAD bypass this entirely (handled in resolveHierarchyScope).
   * POSP also bypasses this (they use pospIds scope).
   */
  async resolveManagerScope(
    employeeCode: string,
    role: Role,
  ): Promise<HierarchyScope> {
    // Check in-memory cache first
    const cached = this.cache.get(employeeCode);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.scope;
    }

    // Try live API first, fall back to DB cache
    let scope: HierarchyScope;
    try {
      scope = await this.resolveFromLiveApi(employeeCode, role);
      this.logger.debug(`Resolved scope for ${employeeCode} from live API`);
    } catch (err) {
      this.logger.warn(
        `Live API scope resolution failed for ${employeeCode}: ${String(err)} — falling back to DB cache`,
      );
      scope = await this.resolveFromDbCache(employeeCode, role);
    }

    // Store in cache
    this.cache.set(employeeCode, {
      scope,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return scope;
  }

  /** Invalidates the cache for a given employeeCode (e.g. on SSO login). */
  invalidateCache(employeeCode: string): void {
    this.cache.delete(employeeCode);
  }

  // ── Live API resolution ───────────────────────────────────────────────────

  private async resolveFromLiveApi(
    employeeCode: string,
    role: Role,
  ): Promise<HierarchyScope> {
    const rows = await (this.externalApi['useSnapshot']
      ? Promise.resolve(
          this.externalApi.listHierarchy({ userCode: employeeCode }),
        )
      : this.externalApi.listHierarchyLive({ userCode: employeeCode }));

    if (!rows || rows.length === 0) {
      return { districtIds: [] };
    }

    const districtIds = rows
      .map((r) => r.DistrictId)
      .filter((id): id is string => !!id);

    // For ZH and SZH: extract zone/region info from rows when available
    // Hierarchy row gives us the chain — the districtIds are the territory
    return this.buildScopeFromRole(role, districtIds);
  }

  // ── DB cache fallback ─────────────────────────────────────────────────────

  private async resolveFromDbCache(
    employeeCode: string,
    role: Role,
  ): Promise<HierarchyScope> {
    const column = this.roleToColumn(role);
    if (!column) return { districtIds: [] };

    const rows = await this.prisma.districtHierarchy.findMany({
      where: { [column]: employeeCode },
      select: { districtId: true },
    });

    const districtIds = rows.map((r) => r.districtId);
    return this.buildScopeFromRole(role, districtIds);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Converts a list of districtIds into the appropriate HierarchyScope shape
   * for the given role. For all manager roles we use districtIds as the
   * primary scope — the dashboard repository further supports zone/region
   * narrowing via query params.
   */
  private buildScopeFromRole(
    role: Role,
    districtIds: string[],
  ): HierarchyScope {
    if (districtIds.length === 0) return { districtIds: [] };
    return { districtIds };
  }

  private roleToColumn(role: Role): string | undefined {
    const usertypeForRole: Partial<Record<Role, number>> = {
      [Role.DM]: ExternalUserType.CH,
      [Role.ASM]: ExternalUserType.ASM,
      [Role.RH]: ExternalUserType.RH,
      [Role.ZH]: ExternalUserType.ZH,
      [Role.NATIONAL_HEAD]: ExternalUserType.SZH,
    };
    const usertype = usertypeForRole[role];
    if (usertype === undefined) return undefined;
    return externalUserTypeToHierarchyColumn(usertype);
  }

  /**
   * Re-exports the role-mapping utility for use in SSO service and tests.
   */
  static externalUserTypeToRole(
    usertype: number,
  ): ReturnType<typeof externalUserTypeToRole> {
    return externalUserTypeToRole(usertype);
  }
}
