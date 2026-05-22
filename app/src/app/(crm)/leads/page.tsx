"use client";

import { DealModal } from "@/components/deals/DealModal";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { fmtDate, fmtINRShort } from "@/lib/formatters";
import { pospName } from "@/lib/crm-calculations";
import { useCrm } from "@/providers/crm-provider";
import type { Deal, DealStatus } from "@/lib/types";
import { useMemo, useState } from "react";

const COLS: { key: DealStatus; label: string; cls: string }[] = [
  { key: "H", label: "Hot", cls: "hot" },
  { key: "W", label: "Warm", cls: "warm" },
  { key: "C", label: "Cold", cls: "" },
];

export default function LeadsPage() {
  const { deals, posp, loading } = useCrm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editDeal, setEditDeal] = useState<Deal | null>(null);

  const byStatus = useMemo(() => {
    const map: Record<DealStatus, Deal[]> = { H: [], W: [], C: [] };
    deals.forEach((d) => map[d.status].push(d));
    return map;
  }, [deals]);

  if (loading) return <div className="empty">Loading…</div>;

  return (
    <>
      <PageHeader
        title="Leads Pipeline"
        subtitle="Drag-style view of leads by temperature (Hot / Warm / Cold)"
        actions={
          <Button
            onClick={() => {
              setEditDeal(null);
              setModalOpen(true);
            }}
          >
            + New Lead
          </Button>
        }
      />

      <div className="kanban">
        {COLS.map((c) => (
          <div key={c.key} className="kanban-col">
            <div className="kanban-col-header">
              <span>{c.label}</span>
              <span className="kanban-count">{byStatus[c.key].length}</span>
            </div>
            {byStatus[c.key].length === 0 ? (
              <div className="empty" style={{ padding: 20 }}>
                No leads
              </div>
            ) : (
              byStatus[c.key].map((d) => (
                <div
                  key={d.id}
                  className={`lead-card ${c.cls}`}
                  onClick={() => {
                    setEditDeal(d);
                    setModalOpen(true);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setEditDeal(d);
                      setModalOpen(true);
                    }
                  }}
                >
                  <div className="lead-card-name">{d.customer}</div>
                  <div className="lead-card-meta">
                    {d.policy} • {fmtINRShort(d.premium)}
                  </div>
                  <div className="lead-card-meta">
                    POSP: {pospName(posp, d.pospId)} • {fmtDate(d.expected)}
                  </div>
                </div>
              ))
            )}
          </div>
        ))}
      </div>

      <DealModal open={modalOpen} deal={editDeal} onClose={() => setModalOpen(false)} />
    </>
  );
}
