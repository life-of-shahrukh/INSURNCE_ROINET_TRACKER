"use client";

import { DealsByStatusChart } from "@/components/charts/DealsByStatusChart";
import { PremiumByPolicyChart } from "@/components/charts/PremiumByPolicyChart";
import { TopPospChart } from "@/components/charts/TopPospChart";
import { DealModal } from "@/components/deals/DealModal";
import { UniversalFilter } from "@/components/filters/UniversalFilter";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { computeDashboardKpis, pospName } from "@/lib/crm-calculations";
import { applyFiltersToDeals } from "@/lib/filters/filter-utils";
import { fmtDate, fmtINR, fmtINRShort } from "@/lib/formatters";
import { useCrm } from "@/providers/crm-provider";
import { useAuth } from "@/providers/auth-provider";
import { useFilterState } from "@/hooks/useFilterState";
import type { Deal } from "@/lib/types";
import { useMemo, useState } from "react";

export default function DashboardPage(): React.ReactElement {
  const { deals, posp, loading, exportCsv } = useCrm();
  const { user } = useAuth();
  const role = user?.role ?? "POSP";

  const { filters, setFilter, applyFilters, resetFilters, activeCount } = useFilterState();
  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [editDeal, setEditDeal] = useState<Deal | null>(null);

  const filteredDeals = useMemo(
    () => applyFiltersToDeals(deals, filters),
    [deals, filters],
  );

  const kpis = useMemo(
    () => computeDashboardKpis(filteredDeals, posp),
    [filteredDeals, posp],
  );

  const recent = useMemo(
    () =>
      [...filteredDeals]
        .sort((a, b) => {
          const aDate = new Date(a.createdAt || 0).getTime();
          const bDate = new Date(b.createdAt || 0).getTime();
          return bDate - aDate;
        })
        .slice(0, 5),
    [filteredDeals],
  );

  if (loading) {
    return <div className="empty">Loading…</div>;
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your sales performance"
        actions={
          <>
            <Button variant="secondary" onClick={() => exportCsv()}>
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

      <UniversalFilter
        role={role}
        filters={filters}
        onFilterChange={setFilter}
        onApplyFilters={applyFilters}
        onReset={resetFilters}
        activeCount={activeCount}
      />

      <div className="kpi-grid">
        <KpiCard
          label="Total Premium"
          value={fmtINRShort(kpis.totalPremium)}
          sub={`${kpis.dealCount} deals tracked`}
        />
        <KpiCard
          label="Retained Margin"
          value={fmtINRShort(kpis.totalMargin)}
          sub="After COA"
          variant="success"
        />
        <KpiCard
          label="Hot Deals"
          value={String(kpis.hotDeals)}
          sub="Likely to close soon"
          variant="hot"
        />
        <KpiCard
          label="Active POSPs"
          value={String(kpis.activePosps)}
          sub="Selling now"
          variant="warm"
        />
        <KpiCard
          label="Conversion"
          value={`${kpis.conv}%`}
          sub={`${kpis.issued} issued / ${kpis.dealCount}`}
        />
      </div>

      <div className="row-2">
        <Card title="Deals by Status">
          <DealsByStatusChart deals={filteredDeals} />
        </Card>
        <Card title="Premium by Policy Type">
          <PremiumByPolicyChart deals={filteredDeals} />
        </Card>
      </div>

      <Card title="Top POSPs by Premium">
        <TopPospChart deals={filteredDeals} posp={posp} />
      </Card>

      <Card title="Recent Deals">
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
              {recent.map((d) => (
                <tr key={d.id}>
                  <td>{d.customer}</td>
                  <td>{pospName(posp, d.pospId)}</td>
                  <td>{d.policy}</td>
                  <td className="num">{fmtINR(d.premium)}</td>
                  <td>
                    <Badge status={d.status} />
                  </td>
                  <td>{fmtDate(d.expected)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <DealModal
        open={dealModalOpen}
        deal={editDeal}
        onClose={() => setDealModalOpen(false)}
      />
    </>
  );
}
