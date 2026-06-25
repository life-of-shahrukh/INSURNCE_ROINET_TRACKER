"use client";

import { useState, useMemo } from "react";
import { useLeads, useMonthlyCommitment, useDeleteLead } from "@/hooks/useLeads";
import { useListQueryState } from "@/hooks/useListQueryState";
import { Pagination } from "@/components/ui/Pagination";
import { ListDataSection } from "@/components/ui/ListDataSection";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { UniversalFilter } from "@/components/filters/UniversalFilter";
import { DealModal } from "@/components/deals/DealModal";
import { TrashIconButton } from "@/components/ui/TrashIconButton";
import { useListQueryStatus } from "@/hooks/useListQueryStatus";
import { useAuth } from "@/providers/auth-provider";
import { fmtINRShort, fmtINR } from "@/lib/formatters";
import type { Lead, ClosureTimeline } from "@/lib/api/lead-api";
import {
  CLOSURE_TIMELINE_COLUMNS,
  getClosureTimelineMeta,
} from "@/lib/closure-timeline";
import { fetchAndDownloadCsv } from "@/lib/crm-calculations";
import { toast } from "sonner";

const PRODUCT_ICON: Record<string, string> = {
  HEALTH:          "✚",
  MOTOR:           "◈",
  LIFE:            "♥",
  TRAVEL:          "✈",
  COMMERCIAL_LINES: "⚙",
  RURAL:           "🌾",
  HOME:            "⌂",
};

function TimelineStatusBadge({
  timeline,
}: {
  timeline: ClosureTimeline;
}): React.ReactElement {
  const meta = getClosureTimelineMeta(timeline);
  return (
    <span
      className="lead-timeline-badge"
      style={{
        color: meta.color,
        borderColor: meta.color,
        background: meta.bgColor,
      }}
    >
      {meta.label}
    </span>
  );
}

export default function LeadsPage() {
  const {
    filters,
    query,
    resetFilters,
    removeFilterChip,
    setSearch,
    setPage,
    setPageSize,
    applyViewFilters,
    apiParams,
  } = useListQueryState(undefined, "leads");

  const leadsQuery = useLeads(apiParams);
  const { data: result } = leadsQuery;
  const { isInitialLoading, isRefreshing } = useListQueryStatus(leadsQuery);
  const leadsData = result?.data;
  const meta = result?.meta;
  const leads = useMemo(() => leadsData ?? [], [leadsData]);

  const { data: commitment } = useMonthlyCommitment();
  const deleteLead = useDeleteLead();
  const { user } = useAuth();
  const role = user?.role ?? "POSP";

  const [modalOpen, setModalOpen] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await fetchAndDownloadCsv("/api/leads/export", "leads.csv", apiParams);
    } catch {
      toast.error("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const byTimeline = useMemo(() => {
    const map: Record<ClosureTimeline, Lead[]> = {
      THIS_MONTH: [], T_PLUS_1: [], T_PLUS_2: [], LATER: [],
    };
    leads.forEach((l) => {
      const bucket = map[l.closureTimeline] ? l.closureTimeline : "LATER";
      map[bucket].push(l);
    });
    return map;
  }, [leads]);

  const handleDelete = async (lead: Lead) => {
    if (lead.status === "WON" || lead.convertedToDealId) {
      toast.error("Converted leads cannot be deleted. Remove the deal from Deals Tracker first.");
      return;
    }
    if (!confirm(`Delete lead for ${lead.customer?.name ?? "this customer"}?`)) return;
    try {
      await deleteLead.mutateAsync(lead.id);
      toast.success("Lead deleted");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Please try again.";
      toast.error(`Failed to delete lead: ${msg}`);
    }
  };

  return (
    <>
      <div className="list-page">
      <PageHeader
        title="Leads Pipeline"
        subtitle="Hot (this month) · Warm (T+1) · Cold (T+2) · Later (2+ months)"
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" onClick={handleExport} disabled={exporting}>
              {exporting ? "Exporting…" : "Export CSV"}
            </Button>
            {role === "POSP" && (
              <Button onClick={() => { setEditLead(null); setModalOpen(true); }}>
                + New Lead
              </Button>
            )}
          </div>
        }
      />

      <UniversalFilter
        view="leads"
        role={role}
        query={query}
        filters={filters}
        applyViewFilters={applyViewFilters}
        onRemoveChip={removeFilterChip}
        onReset={resetFilters}
        search={query.search}
        onSearchChange={setSearch}
      />

      <div className="kpi-row" style={{ marginBottom: 24 }}>
        <div className="kpi-card" style={{ flex: "0 0 auto", minWidth: 220 }}>
          <div className="kpi-label">Monthly Commitment</div>
          <div className="kpi-value">{fmtINR(commitment?.total || 0)}</div>
          <div className="kpi-sub">{commitment?.count || 0} hot leads closing this month</div>
        </div>
        <div className="kpi-card" style={{ flex: "0 0 auto", minWidth: 220 }}>
          <div className="kpi-label">Total Active Leads</div>
          <div className="kpi-value">
            {leads.filter((l) => l.status !== "WON" && l.status !== "LOST").length}
          </div>
          <div className="kpi-sub">across all timelines</div>
        </div>
        <div className="kpi-card" style={{ flex: "0 0 auto", minWidth: 220 }}>
          <div className="kpi-label">Done (Deals)</div>
          <div className="kpi-value">
            {leads.filter((l) => l.status === "WON").length}
          </div>
          <div className="kpi-sub">with policy number</div>
        </div>
      </div>

      <ListDataSection
        isInitialLoading={isInitialLoading}
        isRefreshing={isRefreshing}
        stretch
        skeletonVariant="kanban"
      >
        <div className="kanban kanban--timeline">
        {CLOSURE_TIMELINE_COLUMNS.map((col) => (
          <div
            key={col.key}
            className={`kanban-col kanban-col--${col.cssClass}`}
            style={{
              background: col.bgColor,
              borderTop: `3px solid ${col.borderColor}`,
            }}
          >
            <div className="kanban-col-header">
              <div>
                <span style={{ color: col.color, fontWeight: 700 }}>{col.label}</span>
                <div className="kanban-col-subtitle">{col.subtitle}</div>
              </div>
              <span className="kanban-count">{byTimeline[col.key].length}</span>
            </div>
            {byTimeline[col.key].length === 0 ? (
              <div className="empty" style={{ padding: 20, fontSize: 12 }}>No leads</div>
            ) : (
              byTimeline[col.key].map((lead) => {
                const timelineMeta = getClosureTimelineMeta(lead.closureTimeline);
                const policyNo = lead.convertedDeal?.policyNo;
                const isWon = lead.status === "WON";

                return (
                <div
                  key={lead.id}
                  className={`lead-card lead-card--${timelineMeta.cssClass}`}
                  style={{ position: "relative" }}
                >
                  <span
                    title={lead.product}
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      fontSize: 18,
                      opacity: 0.6,
                    }}
                  >
                    {PRODUCT_ICON[lead.product] || lead.product}
                  </span>

                  <div className="lead-card-name">{lead.customer?.name || "—"}</div>

                  <div className="lead-card-meta">
                    Est. Premium: <strong>{fmtINRShort(lead.estimatedPremium)}</strong>
                  </div>

                  <div style={{ marginTop: 6, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    {isWon ? (
                      <span className="lead-done-badge">DONE</span>
                    ) : (
                      <TimelineStatusBadge timeline={lead.closureTimeline} />
                    )}
                    {policyNo ? (
                      <span style={{ fontSize: 11, color: "#2a9d8f", fontWeight: 600 }}>
                        Policy: {policyNo}
                      </span>
                    ) : null}
                  </div>

                  {lead.expectedCloseDate && (
                    <div className="lead-card-meta" style={{ marginTop: 4 }}>
                      Close: {new Date(lead.expectedCloseDate).toLocaleDateString("en-IN")}
                    </div>
                  )}

                  <div style={{ marginTop: 8, display: "flex", gap: 6, alignItems: "center" }}>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => { setEditLead(lead); setModalOpen(true); }}
                    >
                      Edit
                    </button>
                    {!isWon && !lead.convertedToDealId ? (
                      <TrashIconButton
                        onClick={() => void handleDelete(lead)}
                        title="Delete lead"
                      />
                    ) : null}
                  </div>
                </div>
                );
              })
            )}
          </div>
        ))}
        </div>

        {meta ? (
          <Pagination meta={meta} onPageChange={setPage} onPageSizeChange={setPageSize} />
        ) : null}
      </ListDataSection>
      </div>

      <DealModal
        open={modalOpen}
        lead={editLead}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
