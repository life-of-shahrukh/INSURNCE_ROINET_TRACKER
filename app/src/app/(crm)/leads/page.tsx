"use client";

import { useState, useMemo } from "react";
import { useLeads, useMonthlyCommitment, useUpdateLead, useConvertLeadToDeal } from "@/hooks/useLeads";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { LeadModal } from "@/components/lead/LeadModal";
import { UniversalFilter } from "@/components/filters/UniversalFilter";
import { useFilterState } from "@/hooks/useFilterState";
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
  const { data: leads, isLoading } = useLeads();
  const { data: commitment } = useMonthlyCommitment();
  const updateLead = useUpdateLead();
  const convertToDeal = useConvertLeadToDeal();
  const { user } = useAuth();
  const role = user?.role ?? "POSP";

  const { filters, setFilter, applyFilters, resetFilters, activeCount } = useFilterState();
  const [modalOpen, setModalOpen] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | LeadStatus>("all");

  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    let list = leads;
    if (activeFilter !== "all") {
      list = list.filter((l) => l.status === activeFilter);
    }
    if (filters.productLine) {
      list = list.filter((l) => l.product === filters.productLine);
    }
    return list;
  }, [leads, activeFilter, filters.productLine]);

  const byTimeline = useMemo(() => {
    const map: Record<ClosureTimeline, Lead[]> = {
      THIS_MONTH: [], T_PLUS_1: [], T_PLUS_2: [], LATER: [],
    };
    filteredLeads.forEach((l) => {
      if (map[l.closureTimeline]) map[l.closureTimeline].push(l);
    });
    return map;
  }, [filteredLeads]);

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

  if (isLoading) return <div className="empty">Loading leads…</div>;

  return (
    <>
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
        role={role}
        filters={filters}
        onFilterChange={setFilter}
        onApplyFilters={applyFilters}
        onReset={resetFilters}
        activeCount={activeCount}
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
            {leads?.filter((l) => l.status !== "WON" && l.status !== "LOST").length || 0}
          </div>
          <div className="kpi-sub">across all timelines</div>
        </div>
        <div className="kpi-card" style={{ flex: "0 0 auto", minWidth: 220 }}>
          <div className="kpi-label">Won This Month</div>
          <div className="kpi-value">
            {leads?.filter((l) => l.status === "WON").length || 0}
          </div>
          <div className="kpi-sub">&nbsp;</div>
        </div>
      </div>

      {/* Status filter pills */}
      <div style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {(["all", "NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "WON", "LOST"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setActiveFilter(s)}
            style={{
              padding: "4px 12px",
              borderRadius: 20,
              border: "1px solid #ddd",
              background: activeFilter === s ? "#0f4c75" : "white",
              color: activeFilter === s ? "white" : "#333",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: activeFilter === s ? 600 : 400,
            }}
          >
            {s === "all" ? "All" : s.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Kanban by Timeline */}
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

      <LeadModal
        open={modalOpen}
        lead={editLead}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
