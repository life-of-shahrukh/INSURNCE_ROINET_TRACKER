"use client";

import { useState, useMemo } from "react";
import { useLeads, useMonthlyCommitment, useUpdateLead, useConvertLeadToDeal } from "@/hooks/useLeads";
import { useListQueryState } from "@/hooks/useListQueryState";
import { Pagination } from "@/components/ui/Pagination";
import { ListDataSection } from "@/components/ui/ListDataSection";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { UniversalFilter } from "@/components/filters/UniversalFilter";
import { LeadModal } from "@/components/lead/LeadModal";
import { useListQueryStatus } from "@/hooks/useListQueryStatus";
import { useAuth } from "@/providers/auth-provider";
import { fmtINRShort, fmtINR } from "@/lib/formatters";
import type { Lead, ClosureTimeline, LeadStatus } from "@/lib/api/lead-api";

const TIMELINE_COLS: { key: ClosureTimeline; label: string; color: string }[] = [
  { key: "THIS_MONTH", label: "This Month", color: "#2a9d8f" },
  { key: "T_PLUS_1",   label: "T+1",        color: "#3282b8" },
  { key: "T_PLUS_2",   label: "T+2",        color: "#f4a261" },
  { key: "LATER",      label: "Later",      color: "#8e8e8e" },
];

const STATUS_COLORS: Record<LeadStatus, string> = {
  NEW:           "#6c8bb8",
  CONTACTED:     "#f4a261",
  QUALIFIED:     "#3282b8",
  PROPOSAL_SENT: "#e9c46a",
  WON:           "#2a9d8f",
  LOST:          "#e63946",
};

const PRODUCT_ICON: Record<string, string> = {
  LIFE:        "♥",
  HEALTH:      "✚",
  MOTOR:       "◈",
  PROPERTY:    "⌂",
  MARINE:      "⚓",
  TRAVEL:      "✈",
  COMMERCIAL:  "⚙",
  CROP:        "🌾",
  ENGINEERING: "🔧",
};

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
  const leads = result?.data ?? [];
  const meta = result?.meta;

  const { data: commitment } = useMonthlyCommitment();
  const updateLead = useUpdateLead();
  const convertToDeal = useConvertLeadToDeal();
  const { user } = useAuth();
  const role = user?.role ?? "POSP";

  const [modalOpen, setModalOpen] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);

  const byTimeline = useMemo(() => {
    const map: Record<ClosureTimeline, Lead[]> = {
      THIS_MONTH: [], T_PLUS_1: [], T_PLUS_2: [], LATER: [],
    };
    leads.forEach((l) => {
      if (map[l.closureTimeline]) map[l.closureTimeline].push(l);
    });
    return map;
  }, [leads]);

  const handleConvert = async (lead: Lead) => {
    if (!confirm(`Convert "${lead.customer?.name}" lead to a Deal?`)) return;
    try {
      await convertToDeal.mutateAsync(lead.id);
      alert("Lead converted to Deal successfully!");
    } catch {
      alert("Failed to convert lead");
    }
  };

  const handleStatusChange = async (lead: Lead, status: LeadStatus) => {
    await updateLead.mutateAsync({ id: lead.id, data: { status } });
  };

  return (
    <>
      <div className="list-page">
      <PageHeader
        title="Leads Pipeline"
        subtitle="Track leads by closure timeline — This Month / T+1 / T+2 / Later"
        actions={
          <Button onClick={() => { setEditLead(null); setModalOpen(true); }}>
            + New Lead
          </Button>
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

      {/* Monthly Commitment KPI */}
      <div className="kpi-row" style={{ marginBottom: 24 }}>
        <div className="kpi-card" style={{ flex: "0 0 auto", minWidth: 220 }}>
          <div className="kpi-label">Monthly Commitment</div>
          <div className="kpi-value">{fmtINR(commitment?.total || 0)}</div>
          <div className="kpi-sub">{commitment?.count || 0} leads closing this month</div>
        </div>
        <div className="kpi-card" style={{ flex: "0 0 auto", minWidth: 220 }}>
          <div className="kpi-label">Total Active Leads</div>
          <div className="kpi-value">
            {leads.filter((l) => l.status !== "WON" && l.status !== "LOST").length}
          </div>
          <div className="kpi-sub">across all timelines</div>
        </div>
        <div className="kpi-card" style={{ flex: "0 0 auto", minWidth: 220 }}>
          <div className="kpi-label">Won This Month</div>
          <div className="kpi-value">
            {leads.filter((l) => l.status === "WON").length}
          </div>
          <div className="kpi-sub">&nbsp;</div>
        </div>
      </div>

      {/* Kanban by Timeline */}
      <ListDataSection isInitialLoading={isInitialLoading} isRefreshing={isRefreshing} stretch>
        <div className="kanban">
        {TIMELINE_COLS.map((col) => (
          <div key={col.key} className="kanban-col">
            <div className="kanban-col-header" style={{ borderTop: `3px solid ${col.color}` }}>
              <span style={{ color: col.color, fontWeight: 700 }}>{col.label}</span>
              <span className="kanban-count">{byTimeline[col.key].length}</span>
            </div>
            {byTimeline[col.key].length === 0 ? (
              <div className="empty" style={{ padding: 20, fontSize: 12 }}>No leads</div>
            ) : (
              byTimeline[col.key].map((lead) => (
                <div key={lead.id} className="lead-card" style={{ position: "relative" }}>
                  <span
                    title={lead.product}
                    style={{ position: "absolute", top: 10, right: 10, fontSize: 18, opacity: 0.6 }}
                  >
                    {PRODUCT_ICON[lead.product] || lead.product}
                  </span>

                  <div className="lead-card-name">{lead.customer?.name || "—"}</div>

                  <div className="lead-card-meta">
                    Est. Premium: <strong>{fmtINRShort(lead.estimatedPremium)}</strong>
                  </div>

                  <div style={{ marginTop: 6 }}>
                    <select
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead, e.target.value as LeadStatus)}
                      style={{
                        fontSize: 11,
                        padding: "2px 6px",
                        borderRadius: 4,
                        border: `1px solid ${STATUS_COLORS[lead.status]}`,
                        color: STATUS_COLORS[lead.status],
                        background: "white",
                        fontWeight: 600,
                      }}
                    >
                      <option value="NEW">NEW</option>
                      <option value="CONTACTED">CONTACTED</option>
                      <option value="QUALIFIED">QUALIFIED</option>
                      <option value="PROPOSAL_SENT">PROPOSAL SENT</option>
                      <option value="WON">WON</option>
                      <option value="LOST">LOST</option>
                    </select>
                  </div>

                  {lead.expectedCloseDate && (
                    <div className="lead-card-meta" style={{ marginTop: 4 }}>
                      Close: {new Date(lead.expectedCloseDate).toLocaleDateString("en-IN")}
                    </div>
                  )}

                  <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => { setEditLead(lead); setModalOpen(true); }}
                    >
                      Edit
                    </button>
                    {lead.status !== "WON" && lead.status !== "LOST" && (
                      <button
                        type="button"
                        className="icon-btn"
                        style={{ background: "#2a9d8f", color: "white", border: "none" }}
                        onClick={() => handleConvert(lead)}
                        disabled={convertToDeal.isPending}
                      >
                        → Deal
                      </button>
                    )}
                    {lead.convertedToDealId && (
                      <span style={{ fontSize: 11, color: "#2a9d8f", alignSelf: "center" }}>
                        ✓ Converted
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ))}
        </div>

        {meta ? (
          <Pagination meta={meta} onPageChange={setPage} onPageSizeChange={setPageSize} />
        ) : null}
      </ListDataSection>
      </div>

      <LeadModal
        open={modalOpen}
        lead={editLead}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
