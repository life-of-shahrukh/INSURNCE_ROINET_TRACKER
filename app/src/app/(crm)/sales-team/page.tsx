"use client";

import { useState } from "react";
import { useSalesTeam, useTeamHierarchy, useSyncTeamFromApi } from "@/hooks/useSalesTeam";
import { useListQueryState } from "@/hooks/useListQueryState";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { ListDataSection } from "@/components/ui/ListDataSection";
import { UniversalFilter } from "@/components/filters/UniversalFilter";
import { SalesTeamModal } from "@/components/sales-team/SalesTeamModal";
import { useListQueryStatus } from "@/hooks/useListQueryStatus";
import { useAuth } from "@/providers/auth-provider";
import type { SalesTeam } from "@/lib/api/sales-team-api";

type Tab = "list" | "hierarchy";

const DESIGNATION_COLOR: Record<string, string> = {
  ASM: "#0f4c75",
  ZH: "#3282b8",
  RH: "#1b8a99",
  SM: "#2a9d8f",
  default: "#666",
};

function HierarchyNode({ member, depth = 0 }: { member: SalesTeam; depth?: number }) {
  const [open, setOpen] = useState(true);
  const color = DESIGNATION_COLOR[member.designation] || DESIGNATION_COLOR.default;
  const hasSubs = member.subordinates && member.subordinates.length > 0;

  return (
    <div style={{ paddingLeft: depth * 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 12px",
          margin: "3px 0",
          background: "white",
          border: `1px solid #e8edf4`,
          borderLeft: `3px solid ${color}`,
          borderRadius: 6,
        }}
      >
        {hasSubs ? (
          <button type="button" onClick={() => setOpen(!open)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 12, color: "#666", padding: 0, width: 16 }}>
            {open ? "▼" : "▶"}
          </button>
        ) : (
          <span style={{ width: 16 }} />
        )}
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 600, color: "#1a1a2e" }}>{member.name}</span>
          <span style={{ marginLeft: 8, fontSize: 11, padding: "1px 6px", borderRadius: 10, background: color, color: "white" }}>
            {member.designation}
          </span>
          <span style={{ marginLeft: 8, fontSize: 11, color: "#666" }}>{member.employeeCode}</span>
        </div>
        <span style={{ fontSize: 11, color: "#888" }}>{member.territory || "—"}</span>
      </div>
      {open && hasSubs && member.subordinates?.map((sub) => (
        <HierarchyNode key={sub.id} member={sub} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function SalesTeamPage() {
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
  } = useListQueryState(undefined, "sales-team");

  const teamQuery = useSalesTeam(apiParams);
  const { data: result } = teamQuery;
  const { isInitialLoading, isRefreshing } = useListQueryStatus(teamQuery);
  const team = result?.data ?? [];
  const meta = result?.meta;

  const { data: hierarchy, isLoading: hierarchyLoading } = useTeamHierarchy();
  const syncMutation = useSyncTeamFromApi();
  const [tab, setTab] = useState<Tab>("list");
  const [modalOpen, setModalOpen] = useState(false);
  const [editMember, setEditMember] = useState<SalesTeam | null>(null);

  const handleSync = async () => {
    if (!confirm("Sync team data from Roinet API?")) return;
    const res = await syncMutation.mutateAsync();
    alert(`Synced ${res.synced} team members.`);
  };

  return (
    <>
      <PageHeader
        title="Sales Team"
        subtitle="Manage your sales hierarchy — ASM, Regional & Zonal Heads"
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" onClick={handleSync} disabled={syncMutation.isPending}>
              {syncMutation.isPending ? "Syncing…" : "Sync from Roinet API"}
            </Button>
            <Button onClick={() => { setEditMember(null); setModalOpen(true); }}>+ Add Member</Button>
          </div>
        }
      />

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(["list", "hierarchy"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              padding: "6px 20px",
              borderRadius: 6,
              border: "1px solid #ddd",
              background: tab === t ? "#0f4c75" : "white",
              color: tab === t ? "white" : "#333",
              cursor: "pointer",
              fontWeight: tab === t ? 600 : 400,
              fontSize: 13,
            }}
          >
            {t === "list" ? "Team List" : "Hierarchy View"}
          </button>
        ))}
      </div>

      {tab === "list" && (
        <div className="list-page-body">
          <UniversalFilter
            view="sales-team"
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
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Code</th>
                      <th>Designation</th>
                      <th>Reports To</th>
                      <th>Territory</th>
                      <th>Mobile</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.length === 0 ? (
                      <tr><td colSpan={8} className="empty">No team members found.</td></tr>
                    ) : (
                      team.map((m) => (
                        <tr key={m.id}>
                          <td><strong>{m.name}</strong></td>
                          <td style={{ color: "#666", fontSize: 12 }}>{m.employeeCode}</td>
                          <td>
                            <span style={{ padding: "2px 8px", borderRadius: 10, background: DESIGNATION_COLOR[m.designation] || DESIGNATION_COLOR.default, color: "white", fontSize: 11, fontWeight: 600 }}>
                              {m.designation}
                            </span>
                          </td>
                          <td style={{ fontSize: 13 }}>{m.manager?.name || "—"}</td>
                          <td>{m.territory || "—"}</td>
                          <td>{m.mobile}</td>
                          <td>{m.status}</td>
                          <td>
                            <button type="button" className="icon-btn" onClick={() => { setEditMember(m); setModalOpen(true); }}>
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {meta ? (
                <Pagination meta={meta} onPageChange={setPage} onPageSizeChange={setPageSize} />
              ) : null}
            </ListDataSection>
          </Card>
        </div>
      )}

      {tab === "hierarchy" && (
        <Card>
          {hierarchyLoading ? (
            <div className="empty">Loading hierarchy…</div>
          ) : !hierarchy || hierarchy.length === 0 ? (
            <div className="empty">No hierarchy data. Try syncing from the Roinet API.</div>
          ) : (
            <div style={{ padding: "8px 0" }}>
              {hierarchy.map((root) => (
                <HierarchyNode key={root.id} member={root} />
              ))}
            </div>
          )}
        </Card>
      )}

      <SalesTeamModal
        open={modalOpen}
        member={editMember}
        teamList={team}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
