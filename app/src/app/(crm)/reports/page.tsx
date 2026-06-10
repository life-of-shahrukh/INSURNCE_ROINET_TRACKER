"use client";

import { ConversionFunnelChart } from "@/components/charts/ConversionFunnelChart";
import { LeadConversionChart } from "@/components/charts/LeadConversionChart";
import { MonthlyTrendChart } from "@/components/charts/MonthlyTrendChart";
import { PospActivityRadarChart } from "@/components/charts/PospActivityRadarChart";
import { ProductFunnelChart } from "@/components/charts/ProductFunnelChart";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { ListDataSection } from "@/components/ui/ListDataSection";
import { UniversalFilter } from "@/components/filters/UniversalFilter";
import { useListQueryState } from "@/hooks/useListQueryState";
import { useListQueryStatus } from "@/hooks/useListQueryStatus";
import { useDealsList } from "@/hooks/useDealsList";
import { useLeads } from "@/hooks/useLeads";
import { computePolicySummary, marginPercent } from "@/lib/crm-calculations";
import { fmtINR } from "@/lib/formatters";
import { useCrm } from "@/providers/crm-provider";
import { useAuth } from "@/providers/auth-provider";
import { useMemo } from "react";

export default function ReportsPage() {
  const { posp, exportCsv } = useCrm();
  const { user } = useAuth();
  const role = user?.role ?? "POSP";

  const {
    filters,
    query,
    search,
    resetFilters,
    removeFilterChip,
    setSearch,
    setPage,
    setPageSize,
    applyViewFilters,
    apiParams,
  } = useListQueryState(undefined, "reports");

  const dealsQuery = useDealsList(apiParams);
  const { data: dealsResult } = dealsQuery;
  const { isInitialLoading, isRefreshing } = useListQueryStatus(dealsQuery);
  const dealsData = dealsResult?.data;
  const meta = dealsResult?.meta;
  const deals = useMemo(() => dealsData ?? [], [dealsData]);

  const leadParams = useMemo(() => new URLSearchParams({ page: "1", pageSize: "100" }), []);
  const { data: leadsResult } = useLeads(leadParams);
  const leads = leadsResult?.data ?? [];

  const summary = useMemo(() => computePolicySummary(deals), [deals]);

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Analytics with server-side filters and pagination"
        actions={
          <Button variant="secondary" onClick={() => exportCsv(apiParams)}>
            ⬇ Export CSV
          </Button>
        }
      />

      <UniversalFilter
        view="reports"
        role={role}
        query={query}
        filters={filters}
        applyViewFilters={applyViewFilters}
        onRemoveChip={removeFilterChip}
        onReset={resetFilters}
        search={search}
        onSearchChange={setSearch}
      />

      <div className="row-2">
        <Card title="Monthly Premium Trend"><MonthlyTrendChart deals={deals} /></Card>
        <Card title="Conversion Funnel"><ConversionFunnelChart deals={deals} /></Card>
      </div>

      <Card title="Funnel by Product"><ProductFunnelChart deals={deals} /></Card>

      <div className="row-2">
        <Card title="Top POSP Performance (Radar)"><PospActivityRadarChart deals={deals} posp={posp} /></Card>
        <Card title="Lead Conversion by Product"><LeadConversionChart leads={leads} /></Card>
      </div>

      <Card title="Summary by Policy Type (current page)">
        <ListDataSection isInitialLoading={isInitialLoading} isRefreshing={isRefreshing} stretch>
          <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Policy Type</th>
                <th>Deals</th>
                <th>Premium</th>
                <th>COA</th>
                <th>Margin</th>
                <th>Margin %</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((row) => (
                <tr key={row.policy}>
                  <td><strong>{row.policy}</strong></td>
                  <td>{row.count}</td>
                  <td className="num-right">{fmtINR(row.premium)}</td>
                  <td className="num-right">{fmtINR(row.coa)}</td>
                  <td className="num-right">{fmtINR(row.margin)}</td>
                  <td className="num-right">{marginPercent(row.margin, row.premium)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {meta ? (
            <Pagination meta={meta} onPageChange={setPage} onPageSizeChange={setPageSize} />
          ) : null}
        </ListDataSection>
      </Card>
    </>
  );
}
