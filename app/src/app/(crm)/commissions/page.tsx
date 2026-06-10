"use client";

import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { ListDataSection } from "@/components/ui/ListDataSection";
import { UniversalFilter } from "@/components/filters/UniversalFilter";
import { useListQueryState } from "@/hooks/useListQueryState";
import { useListQueryStatus } from "@/hooks/useListQueryStatus";
import { useDealsList } from "@/hooks/useDealsList";
import { computeCommissions, marginPercent } from "@/lib/crm-calculations";
import { fmtINR } from "@/lib/formatters";
import { useCrm } from "@/providers/crm-provider";
import { useAuth } from "@/providers/auth-provider";
import { useMemo } from "react";

export default function CommissionsPage() {
  const { posp } = useCrm();
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
  } = useListQueryState(undefined, "commissions");

  const dealsQuery = useDealsList(apiParams);
  const { data: result } = dealsQuery;
  const { isInitialLoading, isRefreshing } = useListQueryStatus(dealsQuery);
  const dealsData = result?.data;
  const meta = result?.meta;
  const rows = useMemo(() => computeCommissions(dealsData ?? [], posp), [dealsData, posp]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (a, r) => ({
          premium: a.premium + r.premium,
          coa: a.coa + r.coa,
          margin: a.margin + r.margin,
          dealCount: a.dealCount + r.dealCount,
          issued: a.issued + r.issued,
        }),
        { premium: 0, coa: 0, margin: 0, dealCount: 0, issued: 0 },
      ),
    [rows],
  );

  return (
    <>
      <div className="list-page">
      <PageHeader
        title="Commissions"
        subtitle="COA and retained margin by POSP (current page of deals)"
      />

      <UniversalFilter
        view="commissions"
        role={role}
        query={query}
        filters={filters}
        applyViewFilters={applyViewFilters}
        onRemoveChip={removeFilterChip}
        onReset={resetFilters}
        search={search}
        onSearchChange={setSearch}
      />

      <Card className="list-table-card">
        <ListDataSection isInitialLoading={isInitialLoading} isRefreshing={isRefreshing} stretch>
          <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>POSP</th>
                <th>Deals</th>
                <th>Issued</th>
                <th>Total Premium</th>
                <th>COA</th>
                <th>Margin</th>
                <th>Margin %</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={7} className="empty">No commission data for this page.</td></tr>
              ) : (
                <>
                  {rows.map((r) => (
                    <tr key={r.posp.id}>
                      <td><strong>{r.posp.name}</strong></td>
                      <td>{r.dealCount}</td>
                      <td>{r.issued}</td>
                      <td className="num-right">{fmtINR(r.premium)}</td>
                      <td className="num-right">{fmtINR(r.coa)}</td>
                      <td className="num-right">{fmtINR(r.margin)}</td>
                      <td className="num-right">{marginPercent(r.margin, r.premium)}%</td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: 700, background: "#f8fafc" }}>
                    <td>Page total</td>
                    <td>{totals.dealCount}</td>
                    <td>{totals.issued}</td>
                    <td className="num-right">{fmtINR(totals.premium)}</td>
                    <td className="num-right">{fmtINR(totals.coa)}</td>
                    <td className="num-right">{fmtINR(totals.margin)}</td>
                    <td className="num-right">{marginPercent(totals.margin, totals.premium)}%</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
          </div>
          {meta ? (
            <Pagination meta={meta} onPageChange={setPage} onPageSizeChange={setPageSize} />
          ) : null}
        </ListDataSection>
      </Card>
      </div>
    </>
  );
}
