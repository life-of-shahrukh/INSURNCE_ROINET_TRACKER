"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { ListDataSection } from "@/components/ui/ListDataSection";
import { ColumnManagerPanel } from "@/components/ui/ColumnManagerPanel";
import { UniversalFilter } from "@/components/filters/UniversalFilter";
import { useListQueryState } from "@/hooks/useListQueryState";
import { useListQueryStatus } from "@/hooks/useListQueryStatus";
import { useColumnManager } from "@/hooks/useColumnManager";
import type { ColumnConfig } from "@/hooks/useColumnManager";
import { useDealsList } from "@/hooks/useDealsList";
import { computeRenewals, pospName } from "@/lib/crm-calculations";
import { fmtDate, fmtINR } from "@/lib/formatters";
import { useCrm } from "@/providers/crm-provider";
import { useAuth } from "@/providers/auth-provider";
import type { ListQueryParams } from "@/lib/api/list-query-params";

const RENEWALS_QUERY_DEFAULTS: Partial<ListQueryParams> = {
  policyStatus: ["issued"],
  renewals: "true",
};

type RenewalRow = ReturnType<typeof computeRenewals>[number];

const RENEWALS_COLUMNS: ColumnConfig[] = [
  { key: "customer", label: "Customer" },
  { key: "policyNo", label: "Policy #" },
  { key: "type", label: "Type" },
  { key: "premium", label: "Premium" },
  { key: "posp", label: "POSP" },
  { key: "issued", label: "Issued" },
  { key: "renewalDue", label: "Renewal Due" },
  { key: "daysLeft", label: "Days Left" },
];

function renderRenewalCell(
  col: ColumnConfig,
  r: RenewalRow,
  posp: ReturnType<typeof useCrm>["posp"],
): React.ReactNode {
  switch (col.key) {
    case "customer":
      return <td key={col.key}><strong>{r.customer}</strong></td>;
    case "policyNo":
      return <td key={col.key}>{r.policyNo || "–"}</td>;
    case "type":
      return <td key={col.key}>{r.policy}</td>;
    case "premium":
      return <td key={col.key} className="num-right">{fmtINR(r.premium)}</td>;
    case "posp":
      return <td key={col.key}>{pospName(posp, r.pospId)}</td>;
    case "issued":
      return <td key={col.key}>{fmtDate(r.issued)}</td>;
    case "renewalDue":
      return <td key={col.key}>{fmtDate(r.renew)}</td>;
    case "daysLeft":
      return <td key={col.key}>{r.daysLeft} days</td>;
    default:
      return <td key={col.key} />;
  }
}

export default function RenewalsPage(): React.ReactElement {
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

  const colManager = useColumnManager("renewals", RENEWALS_COLUMNS);
  const { visibleColumns } = colManager;

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
            <div className="col-mgr-toolbar">
              <ColumnManagerPanel manager={colManager} />
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {visibleColumns.map((col) => (
                      <th key={col.key}>{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {upcoming.length === 0 ? (
                    <tr>
                      <td colSpan={visibleColumns.length} className="empty">
                        No renewals due in the next 90 days.
                      </td>
                    </tr>
                  ) : (
                    upcoming.map((r) => (
                      <tr key={r.id}>
                        {visibleColumns.map((col) => renderRenewalCell(col, r, posp))}
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
