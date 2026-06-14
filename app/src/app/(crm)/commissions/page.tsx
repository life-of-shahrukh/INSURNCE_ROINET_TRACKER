"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { ListDataSection } from "@/components/ui/ListDataSection";
import { ColumnManagerPanel } from "@/components/ui/ColumnManagerPanel";
import { UniversalFilter } from "@/components/filters/UniversalFilter";
import { useListQueryState } from "@/hooks/useListQueryState";
import { useListQueryStatus } from "@/hooks/useListQueryStatus";
import { useColumnManager } from "@/hooks/useColumnManager";
import type { ColumnConfig } from "@/hooks/useColumnManager";
import { useDealsList } from "@/hooks/useDealsList";
import { computeCommissions, marginPercent, downloadCsv } from "@/lib/crm-calculations";
import { fmtINR } from "@/lib/formatters";
import { useCrm } from "@/providers/crm-provider";
import { useAuth } from "@/providers/auth-provider";

const COMMISSIONS_COLUMNS: ColumnConfig[] = [
  { key: "posp", label: "POSP" },
  { key: "deals", label: "Deals" },
  { key: "issued", label: "Issued" },
  { key: "premium", label: "Total Premium" },
  { key: "coa", label: "COA" },
  { key: "margin", label: "Margin" },
  { key: "marginPct", label: "Margin %" },
];

type CommissionRow = ReturnType<typeof computeCommissions>[number];

interface Totals {
  premium: number;
  coa: number;
  margin: number;
  dealCount: number;
  issued: number;
}

function renderCommissionCell(
  col: ColumnConfig,
  r: CommissionRow,
): React.ReactNode {
  switch (col.key) {
    case "posp":
      return <td key={col.key}><strong>{r.posp.name}</strong></td>;
    case "deals":
      return <td key={col.key}>{r.dealCount}</td>;
    case "issued":
      return <td key={col.key}>{r.issued}</td>;
    case "premium":
      return <td key={col.key} className="num-right">{fmtINR(r.premium)}</td>;
    case "coa":
      return <td key={col.key} className="num-right">{fmtINR(r.coa)}</td>;
    case "margin":
      return <td key={col.key} className="num-right">{fmtINR(r.margin)}</td>;
    case "marginPct":
      return <td key={col.key} className="num-right">{marginPercent(r.margin, r.premium)}</td>;
    default:
      return <td key={col.key} />;
  }
}

function renderTotalsCell(col: ColumnConfig, totals: Totals): React.ReactNode {
  switch (col.key) {
    case "posp":
      return <td key={col.key}>Page total</td>;
    case "deals":
      return <td key={col.key}>{totals.dealCount}</td>;
    case "issued":
      return <td key={col.key}>{totals.issued}</td>;
    case "premium":
      return <td key={col.key} className="num-right">{fmtINR(totals.premium)}</td>;
    case "coa":
      return <td key={col.key} className="num-right">{fmtINR(totals.coa)}</td>;
    case "margin":
      return <td key={col.key} className="num-right">{fmtINR(totals.margin)}</td>;
    case "marginPct":
      return <td key={col.key} className="num-right">{marginPercent(totals.margin, totals.premium)}</td>;
    default:
      return <td key={col.key} />;
  }
}

export default function CommissionsPage(): React.ReactElement {
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
      rows.reduce<Totals>(
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

  const colManager = useColumnManager("commissions", COMMISSIONS_COLUMNS);
  const { visibleColumns } = colManager;

  return (
    <>
      <div className="list-page">
        <PageHeader
          title="Commissions"
          subtitle="COA and retained margin by POSP (current page of deals)"
          actions={
            <Button
              variant="secondary"
              disabled={!rows.length}
              onClick={() => {
                const headers = ["POSP", "Deals", "Issued", "Premium", "COA", "Margin", "Margin %"];
                const csv = [
                  headers,
                  ...rows.map((r) => [
                    r.posp.name,
                    String(r.dealCount),
                    String(r.issued),
                    String(r.premium),
                    String(r.coa),
                    String(r.margin),
                    marginPercent(r.margin, r.premium),
                  ]),
                ]
                  .map((row) => row.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
                  .join("\n");
                downloadCsv(csv, "commissions.csv");
              }}
            >
              Export CSV
            </Button>
          }
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
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={visibleColumns.length} className="empty">
                        No commission data for this page.
                      </td>
                    </tr>
                  ) : (
                    <>
                      {rows.map((r) => (
                        <tr key={r.posp.id}>
                          {visibleColumns.map((col) => renderCommissionCell(col, r))}
                        </tr>
                      ))}
                      <tr style={{ fontWeight: 700, background: "#f8fafc" }}>
                        {visibleColumns.map((col) => renderTotalsCell(col, totals))}
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
