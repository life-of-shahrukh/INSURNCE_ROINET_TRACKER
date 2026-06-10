"use client";

import { ClosureTimelineChart } from "@/components/charts/ClosureTimelineChart";
import { DealsByStatusChart } from "@/components/charts/DealsByStatusChart";
import { KycStatusChart } from "@/components/charts/KycStatusChart";
import { PremiumByPolicyChart } from "@/components/charts/PremiumByPolicyChart";
import { TopPospChart } from "@/components/charts/TopPospChart";
import {
  DashboardPeriodTabs,
  dashboardPeriodLabel,
  type DashboardPeriod,
} from "@/components/dashboard/DashboardPeriodTabs";
import { DealModal } from "@/components/deals/DealModal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { ListDataSection } from "@/components/ui/ListDataSection";
import { computeDashboardKpis, pospName } from "@/lib/crm-calculations";
import { fmtDate, fmtINR, fmtINRShort } from "@/lib/formatters";
import { useLeads } from "@/hooks/useLeads";
import { useCustomers } from "@/hooks/useCustomers";
import { useDealsList } from "@/hooks/useDealsList";
import { useListQueryStatus } from "@/hooks/useListQueryStatus";
import { useCrm } from "@/providers/crm-provider";
import type { Deal } from "@/lib/types";
import { useMemo, useState } from "react";

export default function DashboardPage(): React.ReactElement {
  const { posp, exportCsv } = useCrm();
  const [period, setPeriod] = useState<DashboardPeriod>("month");

  const dealsParams = useMemo(() => {
    return new URLSearchParams({
      page: "1",
      pageSize: "100",
      dateRange: period,
    });
  }, [period]);

  const dealsQuery = useDealsList(dealsParams);
  const { data: dealsResult } = dealsQuery;
  const { isInitialLoading, isRefreshing } = useListQueryStatus(dealsQuery);
  const dealsRaw = dealsResult?.data;
  const filteredDeals = useMemo(() => dealsRaw ?? [], [dealsRaw]);

  const auxParams = useMemo(
    () => new URLSearchParams({ page: "1", pageSize: "100" }),
    [],
  );
  const { data: leadsResult } = useLeads(auxParams);
  const { data: customersResult } = useCustomers(auxParams);
  const leads = leadsResult?.data ?? [];
  const customers = customersResult?.data ?? [];

  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [editDeal, setEditDeal] = useState<Deal | null>(null);

  const periodText = dashboardPeriodLabel(period);

  const kpis = useMemo(
    () => computeDashboardKpis(filteredDeals, posp),
    [filteredDeals, posp],
  );

  const recent = useMemo(
    () =>
      [...filteredDeals]
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 5),
    [filteredDeals],
  );

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your sales performance"
        actions={
          <>
            <Button variant="secondary" onClick={() => exportCsv(dealsParams)}>
              ⬇ Export Data
            </Button>
            <Button onClick={() => { setEditDeal(null); setDealModalOpen(true); }}>
              + New Deal
            </Button>
          </>
        }
      />

      <DashboardPeriodTabs value={period} onChange={setPeriod} />

      <div className="kpi-grid">
        <KpiCard label="Total Premium" value={fmtINRShort(kpis.totalPremium)} sub={`${kpis.dealCount} deals ${periodText}`} />
        <KpiCard label="Retained Margin" value={fmtINRShort(kpis.totalMargin)} sub="After COA" variant="success" />
        <KpiCard label="Hot Deals" value={String(kpis.hotDeals)} sub="Likely to close soon" variant="hot" />
        <KpiCard label="Active POSPs" value={String(kpis.activePosps)} sub="Selling now" variant="warm" />
        <KpiCard label="Conversion" value={`${kpis.conv}%`} sub={`${kpis.issued} issued / ${kpis.dealCount}`} />
      </div>

      <div className="row-2">
        <Card title="Deals by Status"><DealsByStatusChart deals={filteredDeals} /></Card>
        <Card title="Premium by Policy Type"><PremiumByPolicyChart deals={filteredDeals} /></Card>
      </div>

      <Card title="Top POSPs by Premium"><TopPospChart deals={filteredDeals} posp={posp} /></Card>

      <div className="row-2">
        <Card title="Deal Closure Timeline"><ClosureTimelineChart leads={leads} /></Card>
        <Card title="Customer KYC Status"><KycStatusChart customers={customers} /></Card>
      </div>

      <Card title="Recent Deals">
        <ListDataSection isInitialLoading={isInitialLoading} isRefreshing={isRefreshing} stretch>
          <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>POSP</th>
                <th>Policy</th>
                <th>Premium</th>
                <th>Status</th>
                <th>Expected</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty">No deals {periodText}.</td>
                </tr>
              ) : (
                recent.map((d) => (
                  <tr key={d.id}>
                    <td>{d.customer}</td>
                    <td>{pospName(posp, d.pospId)}</td>
                    <td>{d.policy}</td>
                    <td className="num">{fmtINR(d.premium)}</td>
                    <td><Badge status={d.status} /></td>
                    <td>{fmtDate(d.expected)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </ListDataSection>
      </Card>

      <DealModal open={dealModalOpen} deal={editDeal} onClose={() => setDealModalOpen(false)} />
    </>
  );
}
