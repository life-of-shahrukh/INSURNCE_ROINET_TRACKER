"use client";

import { useMemo, useState } from "react";
import { PospModal } from "@/components/posp/PospModal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { ListDataSection } from "@/components/ui/ListDataSection";
import { UniversalFilter } from "@/components/filters/UniversalFilter";
import { useListQueryState } from "@/hooks/useListQueryState";
import { useListQueryStatus } from "@/hooks/useListQueryStatus";
import { usePospList } from "@/hooks/usePospList";
import { useDealsList } from "@/hooks/useDealsList";
import { fmtDate, fmtINRShort } from "@/lib/formatters";
import { useAuth } from "@/providers/auth-provider";
import type { Posp } from "@/lib/types";
import { fetchAndDownloadCsv } from "@/lib/crm-calculations";
import { toast } from "sonner";

export default function PospPage() {
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
  } = useListQueryState(undefined, "posp");

  const pospQuery = usePospList(apiParams);
  const { data: pospResult } = pospQuery;
  const { isInitialLoading, isRefreshing } = useListQueryStatus(pospQuery);
  const posp = pospResult?.data ?? [];
  const meta = pospResult?.meta;

  const dealsParams = useMemo(() => new URLSearchParams({ pageSize: "100", page: "1" }), []);
  const { data: dealsResult } = useDealsList(dealsParams);
  const deals = dealsResult?.data ?? [];

  const [modalOpen, setModalOpen] = useState(false);
  const [editPosp, setEditPosp] = useState<Posp | null>(null);
  const [exporting, setExporting] = useState(false);

  const canCreatePosp =
    user?.role === "SUPER_ADMIN" || user?.role === "ASM" || user?.role === "DM";

  const handleExport = async () => {
    setExporting(true);
    try {
      await fetchAndDownloadCsv("/api/posp/export", "posp.csv", apiParams);
    } catch {
      toast.error("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <div className="list-page">
      <PageHeader
        title="POSP Roster"
        subtitle="Active and inactive Point of Sales Persons"
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" onClick={handleExport} disabled={exporting}>
              {exporting ? "Exporting…" : "Export CSV"}
            </Button>
            {canCreatePosp && (
              <Button onClick={() => { setEditPosp(null); setModalOpen(true); }}>+ Add POSP</Button>
            )}
          </div>
        }
      />

      <UniversalFilter
        view="posp"
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
        <div className="posp-grid">
        {posp.length === 0 ? (
          <div className="empty">No POSPs match these filters.</div>
        ) : (
          posp.map((p) => {
            const myDeals = deals.filter((d) => d.pospId === p.id);
            const total = myDeals.reduce((a, d) => a + (+d.premium || 0), 0);
            return (
              <div
                key={p.id}
                className="posp-card"
                onClick={
                  canCreatePosp
                    ? () => { setEditPosp(p); setModalOpen(true); }
                    : undefined
                }
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (canCreatePosp && e.key === "Enter") {
                    setEditPosp(p);
                    setModalOpen(true);
                  }
                }}
              >
                <div className="posp-card-header">
                  <div>
                    <div className="posp-name">{p.name}</div>
                    <div className="posp-code">{p.code}</div>
                  </div>
                  <span className={`posp-status ${p.active ? "active" : "inactive"}`}>
                    {p.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="posp-meta">
                  <span>{p.mobile}</span>
                  <span>Joined {fmtDate(p.joined)}</span>
                </div>
                <div className="posp-stats">
                  <span>{myDeals.length} deals</span>
                  <span>{fmtINRShort(total)} premium</span>
                </div>
              </div>
            );
          })
        )}
        </div>

        {meta ? (
          <Pagination meta={meta} onPageChange={setPage} onPageSizeChange={setPageSize} />
        ) : null}
      </ListDataSection>
      </Card>
      </div>

      <PospModal open={modalOpen} pospItem={editPosp} onClose={() => setModalOpen(false)} />
    </>
  );
}
