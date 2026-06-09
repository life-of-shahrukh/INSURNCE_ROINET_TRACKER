"use client";

import { useMemo, useState } from "react";
import { DealModal } from "@/components/deals/DealModal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { UniversalFilter } from "@/components/filters/UniversalFilter";
import { useFilterState } from "@/hooks/useFilterState";
import { applyFiltersToDeals } from "@/lib/filters/filter-utils";
import { pospName } from "@/lib/crm-calculations";
import { fmtDate, fmtINR } from "@/lib/formatters";
import { useCrm } from "@/providers/crm-provider";
import { useAuth } from "@/providers/auth-provider";
import type { Deal } from "@/lib/types";

export default function DealsPage(): React.ReactElement {
  const { deals, posp, loading, deleteDeal } = useCrm();
  const { user } = useAuth();
  const role = user?.role ?? "POSP";

  const { filters, setFilter, applyFilters, resetFilters, activeCount } = useFilterState();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editDeal, setEditDeal] = useState<Deal | null>(null);

  const rows = useMemo(() => {
    let list = applyFiltersToDeals(deals, filters);
    const q = search.toLowerCase();
    if (q) {
      list = list.filter(
        (d) =>
          (d.customer || "").toLowerCase().includes(q) ||
          pospName(posp, d.pospId).toLowerCase().includes(q) ||
          (d.policy || "").toLowerCase().includes(q) ||
          (d.proposal || "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [deals, posp, filters, search]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this deal?")) return;
    await deleteDeal(id);
  };

  if (loading) return <div className="empty">Loading…</div>;

  return (
    <>
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
        role={role}
        filters={filters}
        onFilterChange={setFilter}
        onApplyFilters={applyFilters}
        onReset={resetFilters}
        activeCount={activeCount}
        search={search}
        onSearchChange={setSearch}
      />

      <Card>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>POSP</th>
                <th>Customer</th>
                <th>Policy</th>
                <th>Sum Assured</th>
                <th>Premium</th>
                <th>COA</th>
                <th>Margin</th>
                <th>Status</th>
                <th>Expected</th>
                <th>Proposal #</th>
                <th>Policy #</th>
                <th>Issued</th>
                <th>Remarks</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={14} className="empty">
                    No deals match these filters.
                  </td>
                </tr>
              ) : (
                rows.map((d) => (
                  <tr key={d.id}>
                    <td>{pospName(posp, d.pospId)}</td>
                    <td>
                      <strong>{d.customer}</strong>
                    </td>
                    <td>{d.policy}</td>
                    <td className="num-right">{fmtINR(d.sum)}</td>
                    <td className="num-right">{fmtINR(d.premium)}</td>
                    <td className="num-right">{fmtINR(d.coa)}</td>
                    <td className="num-right">{fmtINR(d.margin)}</td>
                    <td>
                      <Badge status={d.status} />
                    </td>
                    <td>{fmtDate(d.expected)}</td>
                    <td>{d.proposal || "–"}</td>
                    <td>{d.policyNo || "–"}</td>
                    <td>{fmtDate(d.issued)}</td>
                    <td style={{ whiteSpace: "normal", maxWidth: 200 }}>
                      {d.remarks || "–"}
                    </td>
                    <td className="actions-cell">
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => {
                          setEditDeal(d);
                          setModalOpen(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="icon-btn danger"
                        onClick={() => handleDelete(d.id)}
                      >
                        Del
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <DealModal open={modalOpen} deal={editDeal} onClose={() => setModalOpen(false)} />
    </>
  );
}
