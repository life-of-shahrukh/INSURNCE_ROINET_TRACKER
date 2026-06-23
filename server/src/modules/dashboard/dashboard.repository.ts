import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GeoCatalogService } from '../geo/geo-catalog.service';
import {
  buildDealScopeWhere,
  buildPospScopeWhere,
  districtIdsForCode,
  scopeDistrictIds,
  type HierarchyScope,
} from '../../common/auth/hierarchy-scope.util';
import {
  buildGeoFilterWhere,
  mergeWhereClauses,
  resolveDateRange,
} from '../../common/utils/filter.util';
import { pospActiveWhere } from '../../common/business-rules/posp-activity.prisma';
import type { DashboardQueryDto } from './dto/dashboard-query.dto';
import type { DashboardStats } from './dashboard.types';

@Injectable()
export class DashboardRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geoCatalog: GeoCatalogService,
  ) {}

  // ── scope helpers ──────────────────────────────────────────────────────────

  /**
   * When `pospIds` is set in scope, Lead does not have a pospId column.
   * Resolve the POSP records' districtIds and use those for Lead scoping.
   */
  private async buildLeadScopeWhere(
    scope: HierarchyScope,
  ): Promise<Prisma.LeadWhereInput> {
    if (!scope || Object.keys(scope).length === 0) return {};

    if (scope.pospIds !== undefined) {
      if (scope.pospIds.length === 0) return { id: 'NO_MATCH' };
      const posps = await this.prisma.posp.findMany({
        where: { id: { in: scope.pospIds } },
        select: { districtId: true },
      });
      const districtIds = [
        ...new Set(
          posps.map((p) => p.districtId).filter((d): d is string => !!d),
        ),
      ];
      if (districtIds.length === 0) return { id: 'NO_MATCH' };
      return { districtId: { in: districtIds } };
    }
    if (scope.districtIds) return { districtId: { in: scope.districtIds } };
    if (scope.areaIds) return { areaId: { in: scope.areaIds } };
    if (scope.regionIds) return { regionId: { in: scope.regionIds } };
    if (scope.zoneIds) return { zoneId: { in: scope.zoneIds } };
    return {};
  }

  /**
   * Resolves the effective scope for a drill-down selection (district-based).
   * Priority: pospId > (subordinateLevel + subordinateCode) > callerScope.
   *
   * A subordinate selection narrows to the districts that subordinate covers,
   * always intersected with the caller's own districts so the drill can only
   * ever go *down* the caller's territory — never sideways or up.
   */
  private async resolveEffectiveScope(
    callerScope: HierarchyScope,
    _subordinateLevel: string | undefined,
    subordinateCode: string | undefined,
    pospId: string | undefined,
  ): Promise<HierarchyScope> {
    // Terminal POSP-level drill takes highest priority
    if (pospId) return { pospIds: [pospId] };

    // The org graph is role-agnostic — a subordinate is identified by code and
    // resolves to every district they cover, regardless of their level label.
    if (!subordinateCode) return callerScope;

    let districtIds = await districtIdsForCode(this.prisma, subordinateCode);

    // Intersect with the caller's own districts (null = unrestricted caller).
    const callerDistricts = scopeDistrictIds(callerScope);
    if (callerDistricts !== null) {
      const allowed = new Set(callerDistricts);
      districtIds = districtIds.filter((id) => allowed.has(id));
    }

    return { districtIds };
  }

  /**
   * Narrows a scope by an explicit geography selection (state / district /
   * city), translated to a district set and intersected with the scope so it
   * can only ever reduce what the caller already sees. A POSP-level scope is
   * left untouched (geography is implied by the POSP).
   */
  private async applyGeoNarrowing(
    scope: HierarchyScope,
    filters: DashboardQueryDto,
  ): Promise<HierarchyScope> {
    const { zoneId, regionId, stateId, districtId, cityId } = filters;
    if (!zoneId && !regionId && !stateId && !districtId && !cityId)
      return scope;
    if (scope.pospIds !== undefined) return scope; // POSP drill — leave as-is

    // Resolve any geo selection to a district set via the cached catalog
    // (precedence district > city > region > state > zone). Works for every
    // zone/region, not just the DistrictChain rows seen so far.
    const geoDistricts = await this.geoCatalog.resolveDistrictIds({
      zoneId,
      regionId,
      stateId,
      districtId,
      cityId,
    });

    const callerDistricts = scopeDistrictIds(scope);
    if (callerDistricts === null) return { districtIds: geoDistricts };
    const allowed = new Set(callerDistricts);
    return { districtIds: geoDistricts.filter((id) => allowed.has(id)) };
  }

  private buildDealWhere(
    filters: DashboardQueryDto,
    scope: HierarchyScope,
  ): Prisma.DealWhereInput {
    const scopeWhere = buildDealScopeWhere(scope);
    const geoWhere = buildGeoFilterWhere(filters);
    const dateBounds = resolveDateRange(filters);

    const clauses: Prisma.DealWhereInput[] = [];
    if (Object.keys(scopeWhere).length > 0) clauses.push(scopeWhere);
    if (Object.keys(geoWhere).length > 0) clauses.push(geoWhere);
    if (dateBounds) clauses.push({ expected: dateBounds });

    return mergeWhereClauses(...clauses);
  }

  private async buildLeadWhere(
    filters: DashboardQueryDto,
    scope: HierarchyScope,
  ): Promise<Prisma.LeadWhereInput> {
    const scopeWhere = await this.buildLeadScopeWhere(scope);
    const geoWhere = buildGeoFilterWhere(filters);
    const dateBounds = resolveDateRange(filters);

    const clauses: Prisma.LeadWhereInput[] = [];
    if (Object.keys(scopeWhere).length > 0) clauses.push(scopeWhere);
    if (Object.keys(geoWhere).length > 0) clauses.push(geoWhere);
    if (dateBounds) clauses.push({ createdAt: dateBounds });

    return mergeWhereClauses(...clauses);
  }

  private buildPospWhere(scope: HierarchyScope): Prisma.PospWhereInput {
    const scopeWhere = buildPospScopeWhere(scope);
    return Object.keys(scopeWhere).length > 0 ? scopeWhere : {};
  }

  // ── main stats aggregation ─────────────────────────────────────────────────

  async getStats(
    filters: DashboardQueryDto,
    scope: HierarchyScope,
  ): Promise<DashboardStats> {
    let effectiveScope = await this.resolveEffectiveScope(
      scope,
      filters.subordinateLevel,
      filters.subordinateCode,
      filters.pospId,
    );
    effectiveScope = await this.applyGeoNarrowing(effectiveScope, filters);

    const dealWhere = this.buildDealWhere(filters, effectiveScope);
    const leadWhere = await this.buildLeadWhere(filters, effectiveScope);
    const pospWhere = this.buildPospWhere(effectiveScope);

    const customerScopeWhere =
      Object.keys(pospWhere).length > 0
        ? {
            deals: {
              some: buildDealScopeWhere(
                effectiveScope,
              ) as Prisma.DealWhereInput,
            },
          }
        : undefined;

    const [
      dealAgg,
      dealsByStatus,
      dealsByPolicy,
      topPospsRaw,
      issuedCount,
      issuedDeals,
      leadTotal,
      leadsByStatus,
      leadsByTimeline,
      leadsBySource,
      pospTotal,
      pospActive,
      customerTotal,
      customersByKyc,
      monthlyDeals,
    ] = await Promise.all([
      // ── deals ──
      this.prisma.deal.aggregate({
        where: dealWhere,
        _sum: { premium: true, margin: true, coaAmount: true },
        _count: { _all: true },
        _avg: { premium: true },
      }),
      this.prisma.deal.groupBy({
        by: ['status'],
        where: dealWhere,
        _count: { _all: true },
      }),
      this.prisma.deal.groupBy({
        by: ['policy'],
        where: dealWhere,
        _sum: { premium: true },
        _count: { _all: true },
        orderBy: { _sum: { premium: 'desc' } },
      }),
      this.prisma.deal.groupBy({
        by: ['pospId'],
        where: dealWhere,
        _sum: { premium: true },
        _count: { _all: true },
        orderBy: { _sum: { premium: 'desc' } },
        take: 10,
      }),
      this.prisma.deal.count({
        where: { ...dealWhere, policyNo: { not: '' } },
      }),
      // Issued deals for pipeline velocity (createdAt → issued)
      this.prisma.deal.findMany({
        where: { ...dealWhere, issued: { not: null } },
        select: { createdAt: true, issued: true },
        take: 500,
      }),
      // ── leads ──
      this.prisma.lead.count({ where: leadWhere }),
      this.prisma.lead.groupBy({
        by: ['status'],
        where: leadWhere,
        _count: { _all: true },
      }),
      this.prisma.lead.groupBy({
        by: ['closureTimeline'],
        where: leadWhere,
        _count: { _all: true },
      }),
      this.prisma.lead.groupBy({
        by: ['source'],
        where: leadWhere,
        _count: { _all: true },
        orderBy: { _count: { source: 'desc' } },
      }),
      // ── posps ──
      this.prisma.posp.count({ where: pospWhere }),
      this.prisma.posp.count({
        where: mergeWhereClauses(pospWhere, pospActiveWhere()),
      }),
      // ── customers — scoped via their deals' pospId ──
      this.prisma.customer.count({ where: customerScopeWhere }),
      this.prisma.customer.groupBy({
        by: ['kycStatus'],
        where: customerScopeWhere,
        _count: { _all: true },
      }),
      // Monthly premium trend — last 12 months of data in scope
      this.prisma.deal.findMany({
        where: dealWhere,
        select: { createdAt: true, premium: true },
        orderBy: { createdAt: 'asc' },
        take: 5000,
      }),
    ]);

    // Resolve POSP names for top-POSP chart — filter out Self-issued deals (null pospId)
    const topPospIds = topPospsRaw
      .map((p) => p.pospId)
      .filter((id): id is string => id !== null);
    const pospNames =
      topPospIds.length > 0
        ? await this.prisma.posp.findMany({
            where: { id: { in: topPospIds } },
            select: { id: true, name: true },
          })
        : [];
    const nameMap = new Map(pospNames.map((p) => [p.id, p.name]));

    const dealCount = dealAgg._count._all;
    const totalCoa = dealAgg._sum.coaAmount ?? 0;
    const conversionRate = dealCount
      ? Math.round((issuedCount / dealCount) * 100)
      : 0;

    // Pipeline velocity — average calendar days from deal creation to issuance
    const avgDaysToIssue =
      issuedDeals.length > 0
        ? Math.round(
            issuedDeals.reduce((sum, d) => {
              const days =
                (new Date(d.issued!).getTime() -
                  new Date(d.createdAt).getTime()) /
                86_400_000;
              return sum + days;
            }, 0) / issuedDeals.length,
          )
        : 0;

    // Monthly premium grouping: "YYYY-MM" buckets
    const monthlyMap = new Map<string, { premium: number; count: number }>();
    for (const d of monthlyDeals) {
      const key = `${d.createdAt.getFullYear()}-${String(d.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthlyMap.get(key) ?? { premium: 0, count: 0 };
      existing.premium += d.premium;
      existing.count += 1;
      monthlyMap.set(key, existing);
    }
    const monthlyPremium = [...monthlyMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, v]) => ({
        month,
        premium: Math.round(v.premium),
        count: v.count,
      }));

    const activeLeadCount = leadsByStatus
      .filter((s) => !['WON', 'LOST'].includes(s.status))
      .reduce((acc, s) => acc + s._count._all, 0);

    return {
      deals: {
        totalPremium: dealAgg._sum.premium ?? 0,
        totalMargin: dealAgg._sum.margin ?? 0,
        totalCoa,
        count: dealCount,
        avgPremium: Math.round(dealAgg._avg.premium ?? 0),
        hotCount: dealsByStatus.find((s) => s.status === 'H')?._count._all ?? 0,
        warmCount:
          dealsByStatus.find((s) => s.status === 'W')?._count._all ?? 0,
        coldCount:
          dealsByStatus.find((s) => s.status === 'C')?._count._all ?? 0,
        issuedCount,
        conversionRate,
        costPerIssuedPolicy:
          issuedCount > 0 ? Math.round(totalCoa / issuedCount) : 0,
        avgDaysToIssue,
        byPolicy: dealsByPolicy.map((p) => ({
          policy: p.policy,
          premium: p._sum.premium ?? 0,
          count: p._count._all,
        })),
        topPosps: topPospsRaw
          .filter((p) => p.pospId !== null)
          .map((p) => ({
            pospId: p.pospId as string,
            name: nameMap.get(p.pospId as string) ?? (p.pospId as string),
            premium: p._sum.premium ?? 0,
            count: p._count._all,
          })),
        monthlyPremium,
      },
      leads: {
        total: leadTotal,
        activeCount: activeLeadCount,
        byStatus: leadsByStatus.map((s) => ({
          status: s.status,
          count: s._count._all,
        })),
        byTimeline: leadsByTimeline.map((t) => ({
          timeline: t.closureTimeline,
          count: t._count._all,
        })),
        bySource: leadsBySource.map((s) => ({
          source: s.source ?? 'Unknown',
          count: s._count._all,
        })),
      },
      posps: {
        total: pospTotal,
        active: pospActive,
      },
      customers: {
        total: customerTotal,
        byKycStatus: customersByKyc.map((k) => ({
          kycStatus: k.kycStatus,
          count: k._count._all,
        })),
      },
    };
  }
}
