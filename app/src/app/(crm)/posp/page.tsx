"use client";

import { PospModal } from "@/components/posp/PospModal";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { fmtDate, fmtINRShort } from "@/lib/formatters";
import { useCrm } from "@/providers/crm-provider";
import type { Posp } from "@/lib/types";
import { useState } from "react";

export default function PospPage() {
  const { deals, posp, loading } = useCrm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editPosp, setEditPosp] = useState<Posp | null>(null);

  if (loading) return <div className="empty">Loading…</div>;

  return (
    <>
      <PageHeader
        title="POSP Roster"
        subtitle="Active and inactive Point of Sales Persons"
        actions={
          <Button
            onClick={() => {
              setEditPosp(null);
              setModalOpen(true);
            }}
          >
            + Add POSP
          </Button>
        }
      />

      <div className="posp-grid">
        {posp.map((p) => {
          const myDeals = deals.filter((d) => d.pospId === p.id);
          const total = myDeals.reduce((a, d) => a + (+d.premium || 0), 0);
          return (
            <div
              key={p.id}
              className="posp-card"
              onClick={() => {
                setEditPosp(p);
                setModalOpen(true);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
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
                <span className={`badge ${p.active ? "badge-success" : "badge-muted"}`}>
                  {p.active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="posp-contact">
                {p.mobile}
                {p.email ? ` • ${p.email}` : ""}
              </div>
              <div className="posp-stats">
                <div>
                  <div className="posp-stat-label">Deals</div>
                  <div className="posp-stat-val">{myDeals.length}</div>
                </div>
                <div>
                  <div className="posp-stat-label">Premium</div>
                  <div className="posp-stat-val">{fmtINRShort(total)}</div>
                </div>
                <div>
                  <div className="posp-stat-label">Joined</div>
                  <div className="posp-stat-val" style={{ fontSize: 12 }}>
                    {fmtDate(p.joined)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <PospModal open={modalOpen} pospItem={editPosp} onClose={() => setModalOpen(false)} />
    </>
  );
}
