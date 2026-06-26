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
import { Modal } from "@/components/ui/Modal";
import { TrashIconButton } from "@/components/ui/TrashIconButton";
import { useListQueryStatus } from "@/hooks/useListQueryStatus";
import { useAuth } from "@/providers/auth-provider";
import { fmtINRShort, fmtINR } from "@/lib/formatters";
import type { Lead, ClosureTimeline, LeadStatus } from "@/lib/api/lead-api";
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

const PIPELINE_STATUS_META: Record<
  LeadStatus,
  { label: string; color: string; bg: string }
> = {
  NEW:           { label: "New",           color: "#6366f1", bg: "#eef2ff" },
  CONTACTED:     { label: "Contacted",     color: "#0284c7", bg: "#e0f2fe" },
  QUALIFIED:     { label: "Qualified",     color: "#0d9488", bg: "#ccfbf1" },
  PROPOSAL_SENT: { label: "Proposal Sent", color: "#d97706", bg: "#fef3c7" },
  WON:           { label: "Won",           color: "#16a34a", bg: "#dcfce7" },
  LOST:          { label: "Lost",          color: "#dc2626", bg: "#fee2e2" },
};

function PipelineStatusBadge({ status }: { status: LeadStatus }): React.ReactElement {
  const meta = PIPELINE_STATUS_META[status] ?? PIPELINE_STATUS_META.NEW;
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.04em",
        padding: "2px 7px",
        borderRadius: 4,
        color: meta.color,
        background: meta.bg,
        border: `1px solid ${meta.color}33`,
        textTransform: "uppercase",
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
  const [helpOpen, setHelpOpen] = useState(false);

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
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              title="How do Pipeline Status & Temperature work?"
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                border: "1.5px solid #6366f1",
                background: "#eef2ff",
                color: "#6366f1",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              ?
            </button>
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
                  {lead.customer?.clientCode && (
                    <div style={{ fontSize: 10, fontFamily: "monospace", color: "#166534", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 4, padding: "1px 6px", display: "inline-block", marginTop: 2, marginBottom: 2 }}>
                      {lead.customer.clientCode}
                    </div>
                  )}

                  <div className="lead-card-meta">
                    Est. Premium: <strong>{fmtINRShort(lead.estimatedPremium)}</strong>
                  </div>

                  <div style={{ marginTop: 6, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    {isWon ? (
                      <span className="lead-done-badge">DONE</span>
                    ) : (
                      <TimelineStatusBadge timeline={lead.closureTimeline} />
                    )}
                    <PipelineStatusBadge status={lead.status} />
                    {lead.proposalCode ? (
                      <span style={{ fontSize: 10, color: "#92400e", fontWeight: 600, background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 4, padding: "1px 6px" }}>
                        {lead.proposalCode}
                      </span>
                    ) : null}
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

      <LeadHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}

// ─── Help / Info Modal ────────────────────────────────────────────────────────

function LeadHelpModal({ open, onClose }: { open: boolean; onClose: () => void }): React.ReactElement {
  return (
    <Modal
      open={open}
      title="How Pipeline Status & Temperature Work"
      onClose={onClose}
      wide
      footer={
        <Button variant="secondary" onClick={onClose}>
          Got it
        </Button>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

        {/* ── Intro ── */}
        <p style={{ margin: 0, fontSize: 14, color: "#4b5563", lineHeight: 1.6 }}>
          Every lead has <strong>two independent dimensions</strong>: a{" "}
          <span style={{ color: "#6366f1", fontWeight: 700 }}>Pipeline Status</span>{" "}
          that tracks progress through your sales process, and a{" "}
          <span style={{ color: "#dc2626", fontWeight: 700 }}>Temperature</span>{" "}
          that signals urgency and timing.
        </p>

        {/* ── Pipeline Status ── */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{
              background: "#eef2ff", color: "#6366f1", borderRadius: 6,
              padding: "3px 10px", fontSize: 12, fontWeight: 700, letterSpacing: "0.04em",
            }}>
              PIPELINE STATUS
            </span>
            <span style={{ fontSize: 13, color: "#6b7280" }}>— Where is the lead in your sales process?</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                <th style={thStyle}>Stage</th>
                <th style={thStyle}>What it means</th>
              </tr>
            </thead>
            <tbody>
              {[
                { stage: "New",           color: "#6366f1", bg: "#eef2ff", desc: "Lead just captured — nothing done yet" },
                { stage: "Contacted",     color: "#0284c7", bg: "#e0f2fe", desc: "Agent has called or messaged the customer" },
                { stage: "Qualified",     color: "#0d9488", bg: "#ccfbf1", desc: "Customer confirmed interest; basic fit verified" },
                { stage: "Proposal Sent", color: "#d97706", bg: "#fef3c7", desc: "Quote or proposal sent to the customer" },
                { stage: "Won",           color: "#16a34a", bg: "#dcfce7", desc: "Policy issued — lead converted to a deal" },
                { stage: "Lost",          color: "#dc2626", bg: "#fee2e2", desc: "Customer declined or went elsewhere" },
              ].map((r) => (
                <tr key={r.stage} style={{ borderTop: "1px solid #f3f4f6" }}>
                  <td style={tdStyle}>
                    <span style={{
                      display: "inline-block", padding: "2px 8px", borderRadius: 4,
                      fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
                      color: r.color, background: r.bg, border: `1px solid ${r.color}33`,
                      textTransform: "uppercase",
                    }}>
                      {r.stage}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: "#374151" }}>{r.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "#9ca3af" }}>
            Moves forward as the agent takes action. Transitioning to <strong>Proposal Sent</strong> auto-generates a Proposal ID.
            Entering a Policy Number converts the lead to a <strong>Deal</strong>.
          </p>
        </section>

        {/* ── Temperature ── */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{
              background: "#fee2e2", color: "#dc2626", borderRadius: 6,
              padding: "3px 10px", fontSize: 12, fontWeight: 700, letterSpacing: "0.04em",
            }}>
              TEMPERATURE
            </span>
            <span style={{ fontSize: 13, color: "#6b7280" }}>— How urgently should this lead be worked?</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                <th style={thStyle}>Label</th>
                <th style={thStyle}>Closes</th>
                <th style={thStyle}>What to do</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Hot",   color: "#dc2626", bg: "#fee2e2", closes: "This month",     action: "Drop everything — call within the day" },
                { label: "Warm",  color: "#d97706", bg: "#fef3c7", closes: "Next month (T+1)", action: "Personal follow-up within 24 hours" },
                { label: "Cold",  color: "#0284c7", bg: "#dbeafe", closes: "2 months (T+2)",  action: "Send nurture content, weekly check-in" },
                { label: "Later", color: "#6b7280", bg: "#f3f4f6", closes: "2+ months",       action: "Keep in touch monthly; revisit timing" },
              ].map((r) => (
                <tr key={r.label} style={{ borderTop: "1px solid #f3f4f6" }}>
                  <td style={tdStyle}>
                    <span style={{
                      display: "inline-block", padding: "2px 10px", borderRadius: 999,
                      fontSize: 11, fontWeight: 700,
                      color: r.color, background: r.bg, border: `1px solid ${r.color}44`,
                    }}>
                      {r.label}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: "#374151" }}>{r.closes}</td>
                  <td style={{ ...tdStyle, color: "#374151" }}>{r.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "#9ca3af" }}>
            Driven by the expected close date. Changing the date auto-updates the temperature, and vice versa.
          </p>
        </section>

        {/* ── Combination examples ── */}
        <section>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 10 }}>
            How they combine — real examples
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              {
                status: "Contacted", sColor: "#0284c7", sBg: "#e0f2fe",
                temp: "Hot",  tColor: "#dc2626", tBg: "#fee2e2",
                note: "Called the customer, they want a quote this month — send proposal today.",
              },
              {
                status: "Proposal Sent", sColor: "#d97706", sBg: "#fef3c7",
                temp: "Cold", tColor: "#0284c7", tBg: "#dbeafe",
                note: "Quote sent but customer wants 2 months to decide — nurture and wait.",
              },
              {
                status: "Qualified", sColor: "#0d9488", sBg: "#ccfbf1",
                temp: "Hot", tColor: "#dc2626", tBg: "#fee2e2",
                note: "Fit confirmed and urgent — skip the delay, send the proposal now.",
              },
              {
                status: "New", sColor: "#6366f1", sBg: "#eef2ff",
                temp: "Warm", tColor: "#d97706", tBg: "#fef3c7",
                note: "Fresh lead, not yet contacted, closes next month — call within 24h.",
              },
            ].map((ex) => (
              <div
                key={ex.note}
                style={{
                  display: "flex", gap: 10, alignItems: "flex-start",
                  padding: "8px 12px", background: "#f9fafb",
                  borderRadius: 8, border: "1px solid #f3f4f6",
                }}
              >
                <span style={{
                  display: "inline-block", padding: "2px 8px", borderRadius: 4,
                  fontSize: 10, fontWeight: 700, whiteSpace: "nowrap",
                  color: ex.sColor, background: ex.sBg, border: `1px solid ${ex.sColor}33`,
                  textTransform: "uppercase", flexShrink: 0,
                }}>
                  {ex.status}
                </span>
                <span style={{
                  display: "inline-block", padding: "2px 10px", borderRadius: 999,
                  fontSize: 10, fontWeight: 700, whiteSpace: "nowrap",
                  color: ex.tColor, background: ex.tBg, border: `1px solid ${ex.tColor}44`,
                  flexShrink: 0,
                }}>
                  {ex.temp}
                </span>
                <span style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.5 }}>{ex.note}</span>
              </div>
            ))}
          </div>
        </section>

      </div>
    </Modal>
  );
}

const thStyle: React.CSSProperties = {
  padding: "6px 12px",
  textAlign: "left",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.05em",
  color: "#6b7280",
  textTransform: "uppercase",
  borderBottom: "1px solid #e5e7eb",
};

const tdStyle: React.CSSProperties = {
  padding: "8px 12px",
  verticalAlign: "middle",
};
