"use client";

import { useState } from "react";
import { DealModal } from "@/components/deals/DealModal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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
import { pospName } from "@/lib/crm-calculations";
import { fmtDate, fmtINR } from "@/lib/formatters";
import { useCrm } from "@/providers/crm-provider";
import { useAuth } from "@/providers/auth-provider";
import type { Deal } from "@/lib/types";

const DEALS_COLUMNS: ColumnConfig[] = [
  { key: "posp", label: "POSP" },
  { key: "customer", label: "Customer" },
  { key: "policy", label: "Policy" },
  { key: "sum", label: "Sum Assured" },
  { key: "premium", label: "Premium" },
  { key: "coa", label: "COA" },
  { key: "margin", label: "Margin" },
  { key: "status", label: "Status" },
  { key: "expected", label: "Expected" },
  { key: "proposal", label: "Proposal #" },
  { key: "policyNo", label: "Policy #" },
  { key: "issued", label: "Issued" },
  { key: "remarks", label: "Remarks", defaultVisible: false },
  { key: "actions", label: "Actions", alwaysVisible: true },
];

function renderDealsCell(
  col: ColumnConfig,
  d: Deal,
  posp: ReturnType<typeof useCrm>["posp"],
  onEdit: (d: Deal) => void,
  onDelete: (id: string) => void,
): React.ReactNode {
  switch (col.key) {
    case "posp":
      return <td key={col.key}>{pospName(posp, d.pospId)}</td>;
    case "customer":
      return <td key={col.key}><strong>{d.customer}</strong></td>;
    case "policy":
      return <td key={col.key}>{d.policy}</td>;
    case "sum":
      return <td key={col.key} className="num-right">{fmtINR(d.sum)}</td>;
    case "premium":
      return <td key={col.key} className="num-right">{fmtINR(d.premium)}</td>;
    case "coa":
      return <td key={col.key} className="num-right">{fmtINR(d.coa)}</td>;
    case "margin":
      return <td key={col.key} className="num-right">{fmtINR(d.margin)}</td>;
    case "status":
      return <td key={col.key}><Badge status={d.status} /></td>;
    case "expected":
      return <td key={col.key}>{fmtDate(d.expected)}</td>;
    case "proposal":
      return <td key={col.key}>{d.proposal || "–"}</td>;
    case "policyNo":
      return <td key={col.key}>{d.policyNo || "–"}</td>;
    case "issued":
      return <td key={col.key}>{fmtDate(d.issued)}</td>;
    case "remarks":
      return (
        <td key={col.key} style={{ whiteSpace: "normal", maxWidth: 200 }}>
          {d.remarks || "–"}
        </td>
      );
    case "actions":
      return (
        <td key={col.key} className="actions-cell">
          <button
            type="button"
            className="icon-btn"
            onClick={() => onEdit(d)}
          >
            Edit
          </button>
          <button
            type="button"
            className="icon-btn danger"
            onClick={() => onDelete(d.id)}
          >
            Del
          </button>
        </td>
      );
    default:
      return <td key={col.key} />;
  }
}

export default function DealsPage(): React.ReactElement {
  const { posp, deleteDeal } = useCrm();
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
  } = useListQueryState(undefined, "deals");

  const dealsQuery = useDealsList(apiParams);
  const { data: result } = dealsQuery;
  const { isInitialLoading, isRefreshing } = useListQueryStatus(dealsQuery);
  const rows = result?.data ?? [];
  const meta = result?.meta;

  const [modalOpen, setModalOpen] = useState(false);
  const [editDeal, setEditDeal] = useState<Deal | null>(null);

  const colManager = useColumnManager("deals", DEALS_COLUMNS);
  const { visibleColumns } = colManager;

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this deal?")) return;
    await deleteDeal(id);
  };

  return (
    <>
      <div className="list-page">
        <PageHeader
          title="Deals Tracker"
          subtitle="Master list — POSP, customer, policy details, status, expected closure"
          actions={
            <Button
              onClick={() => {
                setEditDeal(null);
                setModalOpen(true);
              }}
            >
              + New Deal
            </Button>
          }
        />

        <UniversalFilter
          view="deals"
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
                        No deals match these filters.
                      </td>
                    </tr>
                  ) : (
                    rows.map((d) => (
                      <tr key={d.id}>
                        {visibleColumns.map((col) =>
                          renderDealsCell(col, d, posp, (deal) => {
                            setEditDeal(deal);
                            setModalOpen(true);
                          }, handleDelete),
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {meta ? (
              <Pagination
                meta={meta}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            ) : null}
          </ListDataSection>
        </Card>
      </div>

      <DealModal open={modalOpen} deal={editDeal} onClose={() => setModalOpen(false)} />
    </>
  );
}
