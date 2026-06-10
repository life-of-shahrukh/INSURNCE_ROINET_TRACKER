"use client";

import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { ListDataSection } from "@/components/ui/ListDataSection";
import { UniversalFilter } from "@/components/filters/UniversalFilter";
import { useListQueryState } from "@/hooks/useListQueryState";
import { useListQueryStatus } from "@/hooks/useListQueryStatus";
import { useDealsList } from "@/hooks/useDealsList";
import { computeRenewals, pospName } from "@/lib/crm-calculations";
import { fmtDate, fmtINR } from "@/lib/formatters";
import { useCrm } from "@/providers/crm-provider";
import { useAuth } from "@/providers/auth-provider";
import { useMemo } from "react";
import type { ListQueryParams } from "@/lib/api/list-query-params";

const RENEWALS_QUERY_DEFAULTS: Partial<ListQueryParams> = {
  policyStatus: ["issued"],
  renewals: "true",
};

export default function RenewalsPage() {
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
  } = useListQueryState(RENEWALS_QUERY_DEFAULTS, "renewals");

  const dealsQuery = useDealsList(apiParams);
  const { data: result } = dealsQuery;
  const { isInitialLoading, isRefreshing } = useListQueryStatus(dealsQuery);
  const dealsData = result?.data;
  const meta = result?.meta;
  const upcoming = useMemo(() => computeRenewals(dealsData ?? []), [dealsData]);

  return (
    <>
      <div className="list-page">
      <PageHeader
        title="Renewals"
        subtitle="Policies due within next 90 days (server-filtered, paginated)"
      />

      <UniversalFilter
        view="renewals"
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
                <th>Customer</th>
                <th>Policy #</th>
                <th>Type</th>
                <th>Premium</th>
                <th>POSP</th>
                <th>Issued</th>
                <th>Renewal Due</th>
                <th>Days Left</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty">No renewals due in the next 90 days.</td>
                </tr>
              ) : (
                upcoming.map((r) => (
                  <tr key={r.id}>
                    <td><strong>{r.customer}</strong></td>
                    <td>{r.policyNo || "–"}</td>
                    <td>{r.policy}</td>
                    <td className="num-right">{fmtINR(r.premium)}</td>
                    <td>{pospName(posp, r.pospId)}</td>
                    <td>{fmtDate(r.issued)}</td>
                    <td>{fmtDate(r.renew)}</td>
                    <td>{r.daysLeft} days</td>
                  </tr>
                ))
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
