"use client";

import { ClosureTimelineChart } from "@/components/charts/ClosureTimelineChart";
import { DealsByStatusChart } from "@/components/charts/DealsByStatusChart";
import { KycStatusChart } from "@/components/charts/KycStatusChart";
import { MonthlyPremiumChart } from "@/components/charts/MonthlyPremiumChart";
import { LeadSourceChart } from "@/components/charts/LeadSourceChart";
import { PremiumByPolicyChart } from "@/components/charts/PremiumByPolicyChart";
import { TopPospChart } from "@/components/charts/TopPospChart";
import {
  DashboardPeriodTabs,
  dashboardPeriodLabel,
  type DashboardPeriod,
} from "@/components/dashboard/DashboardPeriodTabs";
import {
  DashboardScopeBar,
  type DashboardScope,
} from "@/components/dashboard/DashboardScopeBar";
import { DealModal } from "@/components/deals/DealModal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { ListDataSection } from "@/components/ui/ListDataSection";
import { pospName } from "@/lib/crm-calculations";
import { fmtDate, fmtINR, fmtINRShort } from "@/lib/formatters";
import { useDealsList } from "@/hooks/useDealsList";
import { useListQueryStatus } from "@/hooks/useListQueryStatus";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useHierarchyFilterOptions } from "@/hooks/useHierarchyFilterOptions";
import { useCrm } from "@/providers/crm-provider";
import { useAuth } from "@/providers/auth-provider";
import { hasMinRole } from "@/lib/auth-types";
import type { UserRole } from "@/lib/auth-types";
import { canSeeWidget } from "@/lib/dashboard-widget-registry";
import type { Deal } from "@/lib/types";
import { useMemo, useState } from "react";

// ── role helpers ────────────────────────────────────────────────────────────

function dashboardSubtitle(role: UserRole | undefined): string {
  if (!role) return "Overview of your sales performance";
  if (role === "SUPER_ADMIN" || role === "NATIONAL_HEAD")
    return "Overview of company-wide sales performance";
  if (role === "ZH") return "Overview of your zone's sales performance";
  if (role === "RH") return "Overview of your region's sales performance";
  if (role === "ASM" || role === "DM")
    return "Overview of your area's sales performance";
  return "Overview of your personal sales performance";
}

function pospKpiLabel(role: UserRole | undefined): string {
  if (!role || role === "POSP") return "";
  if (role === "SUPER_ADMIN" || role === "NATIONAL_HEAD") return "Active POSPs";
  if (role === "ZH") return "Zone POSPs";
  if (role === "RH") return "Region POSPs";
  return "My POSPs";
}

// ── component ───────────────────────────────────────────────────────────────

export default function DashboardPage(): React.ReactElement {
  const { posp, exportCsv } = useCrm();
  const { user } = useAuth();
  const role = user?.role;

  const [period, setPeriod] = useState<DashboardPeriod>("month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [scopeDrill, setScopeDrill] = useState<DashboardScope>({
    salesTeamPath: [],
  });

  const { data: filterOptions } = useHierarchyFilterOptions();

  const apiParams = useMemo(() => {
    const p = new URLSearchParams({ page: "1", pageSize: "5" });
    if (period === "custom") {
      p.set("dateRange", "custom");
      if (dateFrom) p.set("dateFrom", dateFrom);
      if (dateTo) p.set("dateTo", dateTo);
    } else {
      p.set("dateRange", period === "day" ? "today" : period);
    }
    // Cascading drill-down: pospId takes priority, then deepest SalesTeam selection
    if (scopeDrill.posp) {
      p.set("pospId", scopeDrill.posp.id);
    } else {
      const lastSalesTeamId = scopeDrill.salesTeamPath.at(-1)?.id;
      if (lastSalesTeamId) p.set("subordinateId", lastSalesTeamId);
    }
    return p;
  }, [period, dateFrom, dateTo, scopeDrill]);

  // Stats params has a larger page size so stats are accurate
  const statsParams = useMemo(() => {
    const p = new URLSearchParams(apiParams);
    p.set("pageSize", "1"); // only KPIs from stats; paging size irrelevant
    return p;
  }, [apiParams]);

  // Dedicated stats endpoint — one request for all KPIs and chart data
  const { data: stats, isLoading: statsLoading } =
    useDashboardStats(statsParams);

  // Recent deals table only (pageSize=5)
  const dealsQuery = useDealsList(apiParams);
  const { data: dealsResult } = dealsQuery;
  const { isInitialLoading, isRefreshing } = useListQueryStatus(dealsQuery);
  const recentDeals = useMemo(() => dealsResult?.data ?? [], [dealsResult]);

  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [editDeal, setEditDeal] = useState<Deal | null>(null);

  const periodText = dashboardPeriodLabel(period, dateFrom, dateTo);

  // ── role-based visibility flags (driven by the widget registry) ──────────
  // Use canSeeWidget() for all widget-level decisions so the registry is the
  // single source of truth. Inline flags are kept only for non-widget UI
  // choices (column visibility, scope bar, page subtitle, etc.).
  const isPosp = role === "POSP";

  const showPospKpi        = canSeeWidget(role, "POSP_KPI");
  const showCustomersKpi   = canSeeWidget(role, "CUSTOMERS_KPI");
  const showRetainedMargin = canSeeWidget(role, "RETAINED_MARGIN");
  const showCostPerIssued  = canSeeWidget(role, "COST_PER_ISSUED");
  const showPipelineVel    = canSeeWidget(role, "PIPELINE_VELOCITY");
  const showTopPospChart   = canSeeWidget(role, "TOP_POSP");
  const showKycChart       = canSeeWidget(role, "KYC_STATUS");

  const pospKpi = pospKpiLabel(role);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={dashboardSubtitle(role)}
        actions={
          <>
            <Button variant="secondary" onClick={() => exportCsv(apiParams)}>
              ⬇ Export Data
            </Button>
            <Button
              onClick={() => {
                setEditDeal(null);
                setDealModalOpen(true);
              }}
            >
              + New Deal
            </Button>
          </>
        }
      />

      <DashboardPeriodTabs
        value={period}
        onChange={setPeriod}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
      />

      <DashboardScopeBar
        role={role}
        options={filterOptions ?? { zones: [], regions: [], areas: [], districts: [], subordinates: [], posps: [] }}
        scope={scopeDrill}
        onChange={setScopeDrill}
      />

      {/* ── KPI Row ────────────────────────────────────────────────────── */}
      <div className="kpi-grid">
        <KpiCard
          label="Total Premium"
          value={statsLoading ? "…" : fmtINRShort(stats?.deals.totalPremium ?? 0)}
          sub={`${stats?.deals.count ?? 0} deals ${periodText}`}
        />
        {showRetainedMargin && (
          <KpiCard
            label="Retained Margin"
            value={statsLoading ? "…" : fmtINRShort(stats?.deals.totalMargin ?? 0)}
            sub="After COA"
            variant="success"
          />
        )}
        <KpiCard
          label="Hot Deals"
          value={statsLoading ? "…" : String(stats?.deals.hotCount ?? 0)}
          sub="Likely to close soon"
          variant="hot"
        />
        <KpiCard
          label="Lead Pipeline"
          value={statsLoading ? "…" : String(stats?.leads.activeCount ?? 0)}
          sub={`${stats?.leads.total ?? 0} total leads ${periodText}`}
          variant="warm"
        />
        <KpiCard
          label="Conversion"
          value={statsLoading ? "…" : `${stats?.deals.conversionRate ?? 0}%`}
          sub={`${stats?.deals.issuedCount ?? 0} issued / ${stats?.deals.count ?? 0}`}
        />
        {showPospKpi && (
          <KpiCard
            label={pospKpi}
            value={statsLoading ? "…" : String(stats?.posps.active ?? 0)}
            sub={`${stats?.posps.total ?? 0} total`}
          />
        )}
        {showCustomersKpi && (
          <KpiCard
            label="Customers"
            value={statsLoading ? "…" : String(stats?.customers.total ?? 0)}
            sub={`${stats?.customers.byKycStatus.find((k) => k.kycStatus === "VERIFIED")?.count ?? 0} KYC verified`}
          />
        )}
        <KpiCard
          label="Avg Premium"
          value={statsLoading ? "…" : fmtINRShort(stats?.deals.avgPremium ?? 0)}
          sub="Per deal"
        />
        {showCostPerIssued && (
          <KpiCard
            label="Cost / Issued Policy"
            value={statsLoading ? "…" : fmtINRShort(stats?.deals.costPerIssuedPolicy ?? 0)}
            sub="Acquisition cost"
          />
        )}
        {showPipelineVel && (
          <KpiCard
            label="Pipeline Velocity"
            value={statsLoading ? "…" : `${stats?.deals.avgDaysToIssue ?? 0}d`}
            sub="Avg days to issue"
          />
        )}
      </div>

      {/* ── Row 1: Status + Policy ─────────────────────────────────────── */}
      <div className="row-2">
        <Card title="Deals by Status">
          <DealsByStatusChart
            data={{
              hot: stats?.deals.hotCount ?? 0,
              warm: stats?.deals.warmCount ?? 0,
              cold: stats?.deals.coldCount ?? 0,
            }}
          />
        </Card>
        <Card title="Premium by Policy Type">
          <PremiumByPolicyChart data={stats?.deals.byPolicy ?? []} />
        </Card>
      </div>

      {/* ── Top POSPs (hidden for POSP role) ──────────────────────────── */}
      {showTopPospChart && (
        <Card title={role && hasMinRole(role, "ASM") ? "Top POSPs by Premium" : "Premium by POSP"}>
          <TopPospChart data={stats?.deals.topPosps ?? []} />
        </Card>
      )}

      {/* ── Row 2: Timeline + KYC ─────────────────────────────────────── */}
      <div className="row-2">
        <Card title="Deal Closure Timeline">
          <ClosureTimelineChart data={stats?.leads.byTimeline ?? []} />
        </Card>
        {showKycChart && (
          <Card title="Customer KYC Status">
            <KycStatusChart data={stats?.customers.byKycStatus ?? []} />
          </Card>
        )}
        {!showKycChart && (
          <Card title="Lead Status Breakdown">
            <ClosureTimelineChart
              data={(stats?.leads.byStatus ?? []).map((s) => ({
                timeline: s.status,
                count: s.count,
              }))}
            />
          </Card>
        )}
      </div>

      {/* ── Row 3: Monthly trend + Lead source ────────────────────────── */}
      <div className="row-2">
        <Card title="Premium Trend (Monthly)">
          <MonthlyPremiumChart data={stats?.deals.monthlyPremium ?? []} />
        </Card>
        <Card title={canSeeWidget(role, "PIPELINE_VELOCITY") ? "Lead Sources" : "My Lead Sources"}>
          <LeadSourceChart data={stats?.leads.bySource ?? []} />
        </Card>
      </div>

      {/* ── Recent Deals ──────────────────────────────────────────────── */}
      <Card title="Recent Deals">
        <ListDataSection
          isInitialLoading={isInitialLoading}
          isRefreshing={isRefreshing}
          stretch
        >
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  {!isPosp && <th>POSP</th>}
                  <th>Policy</th>
                  <th>Premium</th>
                  <th>Status</th>
                  <th>Expected</th>
                </tr>
              </thead>
              <tbody>
                {recentDeals.length === 0 ? (
                  <tr>
                    <td colSpan={isPosp ? 5 : 6} className="empty">
                      No deals {periodText}.
                    </td>
                  </tr>
                ) : (
                  recentDeals.map((d) => (
                    <tr key={d.id}>
                      <td>{d.customer}</td>
                      {!isPosp && <td>{pospName(posp, d.pospId)}</td>}
                      <td>{d.policy}</td>
                      <td className="num">{fmtINR(d.premium)}</td>
                      <td>
                        <Badge status={d.status} />
                      </td>
                      <td>{fmtDate(d.expected)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </ListDataSection>
      </Card>

      <DealModal
        open={dealModalOpen}
        deal={editDeal}
        onClose={() => setDealModalOpen(false)}
      />
    </>
  );
}
