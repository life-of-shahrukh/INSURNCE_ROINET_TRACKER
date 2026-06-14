import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildDealScopeWhere,
  buildLeadScopeWhere,
  buildPospScopeWhere,
  type HierarchyScope,
} from '../../common/auth/hierarchy-scope.util';
import {
  buildGeoFilterWhere,
  mergeWhereClauses,
  resolveDateRange,
} from '../../common/utils/filter.util';
import type { DashboardQueryDto } from './dto/dashboard-query.dto';
import type { DashboardStats } from './dashboard.types';

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── where-clause helpers ───────────────────────────────────────────────────

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

  private buildLeadWhere(
    filters: DashboardQueryDto,
    scope: HierarchyScope,
  ): Prisma.LeadWhereInput {
    const scopeWhere = buildLeadScopeWhere(scope);
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
    const dealWhere = this.buildDealWhere(filters, scope);
    const leadWhere = this.buildLeadWhere(filters, scope);
    const pospWhere = this.buildPospWhere(scope);

    const [
      dealAgg,
      dealsByStatus,
      dealsByPolicy,
      topPospsRaw,
      issuedCount,
      leadTotal,
      leadsByStatus,
      leadsByTimeline,
      pospTotal,
      pospActive,
      customerTotal,
      customersByKyc,
    ] = await Promise.all([
      // ── deals ──
      this.prisma.deal.aggregate({
        where: dealWhere,
        _sum: { premium: true, margin: true, coa: true },
        _count: { _all: true },
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
      // ── posps ──
      this.prisma.posp.count({ where: pospWhere }),
      this.prisma.posp.count({ where: { ...pospWhere, active: true } }),
      // ── customers (global — not hierarchy-scoped) ──
      this.prisma.customer.count(),
      this.prisma.customer.groupBy({
        by: ['kycStatus'],
        _count: { _all: true },
      }),
    ]);

    // Resolve POSP names for top-POSP chart — filter out Self-issued deals (null pospId)
    const topPospIds = topPospsRaw.map((p) => p.pospId).filter((id): id is string => id !== null);
    const pospNames =
      topPospIds.length > 0
        ? await this.prisma.posp.findMany({
            where: { id: { in: topPospIds } },
            select: { id: true, name: true },
          })
        : [];
    const nameMap = new Map(pospNames.map((p) => [p.id, p.name]));

    const dealCount = dealAgg._count._all;
    const conversionRate = dealCount
      ? Math.round((issuedCount / dealCount) * 100)
      : 0;

    const activeLeadCount = leadsByStatus
      .filter((s) => !['WON', 'LOST'].includes(s.status))
      .reduce((acc, s) => acc + s._count._all, 0);

    return {
      deals: {
        totalPremium: dealAgg._sum.premium ?? 0,
        totalMargin: dealAgg._sum.margin ?? 0,
        totalCoa: dealAgg._sum.coa ?? 0,
        count: dealCount,
        hotCount: dealsByStatus.find((s) => s.status === 'H')?._count._all ?? 0,
        warmCount:
          dealsByStatus.find((s) => s.status === 'W')?._count._all ?? 0,
        coldCount:
          dealsByStatus.find((s) => s.status === 'C')?._count._all ?? 0,
        issuedCount,
        conversionRate,
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
