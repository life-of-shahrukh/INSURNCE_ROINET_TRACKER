"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ListDataSection } from "@/components/ui/ListDataSection";
import { PayoutGridFilters } from "@/components/payout-grid/PayoutGridFilters";
import { PayoutGridTable } from "@/components/payout-grid/PayoutGridTable";
import { CommissionCard } from "@/components/payout-grid/CommissionCard";
import {
  fetchCommissionMeta,
  searchCommissions,
  type CommissionMeta,
  type CommissionRecord,
  type CommissionSearchParams,
} from "@/lib/api/payout-grid-api";

interface ResultsViewProps {
  readonly records: CommissionRecord[];
  readonly view: "cards" | "table";
  readonly selectedState?: string;
}

function ResultsView({ records, view, selectedState }: ResultsViewProps): React.ReactElement {
  if (view === "table") {
    return <PayoutGridTable records={records} selectedState={selectedState} />;
  }

  return (
    <div className="card-grid">
      {records.slice(0, 100).map((r, i) => (
        <CommissionCard
          key={`${r.insurer}-${r.product}-${i}`}
          record={r}
          selectedState={selectedState}
        />
      ))}
      {records.length > 100 && (
        <div className="more-notice">
          Showing 100 of {records.length} results. Use filters to narrow.
        </div>
      )}

      <style jsx>{`
        .card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1rem;
          padding: 1rem;
        }
        .more-notice {
          grid-column: 1 / -1;
          text-align: center;
          padding: 1rem;
          color: #64748b;
          font-size: 0.8125rem;
        }
      `}</style>
    </div>
  );
}

export default function PayoutGridsPage(): React.ReactElement {
  const [meta, setMeta] = useState<CommissionMeta | null>(null);
  const [records, setRecords] = useState<CommissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [filters, setFilters] = useState<CommissionSearchParams>({});
  const [view, setView] = useState<"cards" | "table">("cards");

  useEffect(() => {
    let cancelled = false;
    fetchCommissionMeta()
      .then((data) => {
        if (!cancelled) setMeta(data);
      })
      .catch(() => {
        if (!cancelled) setMeta(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const doSearch = useCallback((params: CommissionSearchParams) => {
    setSearching(true);
    searchCommissions(params)
      .then(setRecords)
      .catch(() => setRecords([]))
      .finally(() => setSearching(false));
  }, []);

  useEffect(() => {
    if (!loading) {
      doSearch(filters);
    }
  }, [filters, loading, doSearch]);

  const handleFilterChange = useCallback((newFilters: CommissionSearchParams) => {
    setFilters(newFilters);
  }, []);

  const handleViewChange = useCallback((v: "cards" | "table") => {
    setView(v);
  }, []);

  const subtitle = meta
    ? `${records.length} results · ${meta.lobs.reduce((s, l) => s + l.count, 0)} total records`
    : "Commission lookup across all insurers";

  return (
    <div className="list-page">
      <PageHeader
        title="Commission Lookup"
        subtitle={subtitle}
      />

      <PayoutGridFilters
        meta={meta}
        filters={filters}
        view={view}
        onFilterChange={handleFilterChange}
        onViewChange={handleViewChange}
        loading={loading}
      />

      <Card className="list-table-card">
        <ListDataSection
          isInitialLoading={loading}
          isRefreshing={searching}
          stretch
        >
          {records.length > 0 ? (
            <ResultsView
              records={records}
              view={view}
              selectedState={filters.state}
            />
          ) : (
            <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
              {loading
                ? "Loading commission data..."
                : "No results. Try a different search or filter."}
            </div>
          )}
        </ListDataSection>
      </Card>
    </div>
  );
}
