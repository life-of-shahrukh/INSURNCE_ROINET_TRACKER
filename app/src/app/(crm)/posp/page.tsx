"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { ListDataSection } from "@/components/ui/ListDataSection";
import { UserProfileModal } from "@/components/profile/UserProfileModal";
import { PospRosterCard } from "@/components/posp/PospRosterCard";
import { UniversalFilter } from "@/components/filters/UniversalFilter";
import { useListQueryState } from "@/hooks/useListQueryState";
import { useListQueryStatus } from "@/hooks/useListQueryStatus";
import { usePospList } from "@/hooks/usePospList";
import { useAuth } from "@/providers/auth-provider";
import { fetchAndDownloadCsv } from "@/lib/crm-calculations";
import type { ListQueryParams } from "@/lib/api/list-query-params";
import { toast } from "sonner";

const POSP_LIST_DEFAULTS: Partial<ListQueryParams> = {
  pageSize: 100,
  sortBy: "dealCount",
  sortOrder: "desc",
};

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
  } = useListQueryState(POSP_LIST_DEFAULTS, "posp");

  const pospQuery = usePospList(apiParams);
  const { data: pospResult } = pospQuery;
  const { isInitialLoading, isRefreshing } = useListQueryStatus(pospQuery);
  const posp = pospResult?.data ?? [];
  const meta = pospResult?.meta;

  const [exporting, setExporting] = useState(false);
  const [selectedUserCode, setSelectedUserCode] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const openProfile = (code: string) => {
    setSelectedUserCode(code);
    setProfileOpen(true);
  };

  const closeProfile = () => {
    setProfileOpen(false);
    setSelectedUserCode(null);
  };

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
        subtitle="Synced from Roinet — sorted by most deals — inactive = no deals in the last 30 days"
        actions={
          <Button variant="secondary" onClick={handleExport} disabled={exporting}>
            {exporting ? "Exporting…" : "Export CSV"}
          </Button>
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
      <ListDataSection
        isInitialLoading={isInitialLoading}
        isRefreshing={isRefreshing}
        stretch
        skeletonVariant="posp-grid"
      >
        <div className="posp-grid">
        {posp.length === 0 ? (
          <div className="empty">No POSPs match these filters.</div>
        ) : (
          posp.map((p) => (
            <PospRosterCard key={p.id} posp={p} onSelect={openProfile} />
          ))
        )}
        </div>

        {meta ? (
          <Pagination meta={meta} onPageChange={setPage} onPageSizeChange={setPageSize} />
        ) : null}
      </ListDataSection>
      </Card>
      </div>

      <UserProfileModal
        open={profileOpen}
        userCode={selectedUserCode}
        onClose={closeProfile}
      />
    </>
  );
}
