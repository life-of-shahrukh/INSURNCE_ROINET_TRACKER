"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ListDataSection } from "@/components/ui/ListDataSection";
import { useAuth } from "@/providers/auth-provider";
import {
  fetchPayoutGridConfig,
  upsertPayoutGridConfig,
  deletePayoutGridConfig,
  type PayoutGridConfigResponse,
  type PayoutGridConfigRecord,
} from "@/lib/api/payout-grid-api";
import { toast } from "sonner";

const ALL_ROLES = ["POSP", "DM", "ASM", "RH", "ZH", "NATIONAL_HEAD"] as const;

export default function PayoutConfigPage(): React.ReactElement {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<PayoutGridConfigRecord[]>([]);
  const [insurers, setInsurers] = useState<Array<{ insurer: string; insurerSlug: string }>>([]);
  const [pospSearch, setPospSearch] = useState("");
  const [pospOverrides, setPospOverrides] = useState<PayoutGridConfigRecord[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data: PayoutGridConfigResponse = await fetchPayoutGridConfig();
      setConfigs(data.configs);
      setInsurers(
        data.insurers.map((name) => ({
          insurer: name,
          insurerSlug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        })),
      );
      setPospOverrides(data.configs.filter((c) => c.scopeType === "POSP"));
    } catch {
      toast.error("Failed to load payout grid config");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const getConfigForRole = useCallback(
    (role: string, slug: string): PayoutGridConfigRecord | undefined =>
      configs.find(
        (c) => c.scopeType === "ROLE" && c.scopeValue === role && c.insurerSlug === slug,
      ),
    [configs],
  );

  const isVisibleForRole = useCallback(
    (role: string, slug: string): boolean => {
      const cfg = getConfigForRole(role, slug);
      return cfg ? cfg.visible : true;
    },
    [getConfigForRole],
  );

  const handleToggle = useCallback(
    async (scopeType: string, scopeValue: string, insurerSlug: string, currentlyVisible: boolean) => {
      try {
        await upsertPayoutGridConfig({
          scopeType,
          scopeValue,
          insurerSlug,
          visible: !currentlyVisible,
        });
        await loadData();
        toast.success("Config updated");
      } catch {
        toast.error("Failed to update config");
      }
    },
    [loadData],
  );

  const handleDeleteOverride = useCallback(
    async (id: string) => {
      try {
        await deletePayoutGridConfig(id);
        await loadData();
        toast.success("Override removed");
      } catch {
        toast.error("Failed to remove override");
      }
    },
    [loadData],
  );

  const handleAddPospOverride = useCallback(
    async (pospId: string, insurerSlug: string) => {
      try {
        await upsertPayoutGridConfig({
          scopeType: "POSP",
          scopeValue: pospId,
          insurerSlug,
          visible: false,
        });
        await loadData();
        toast.success("POSP override added");
      } catch {
        toast.error("Failed to add override");
      }
    },
    [loadData],
  );

  if (user?.role !== "SUPER_ADMIN") {
    return (
      <div className="list-page">
        <PageHeader title="Access Denied" subtitle="This page is only accessible to Super Admin." />
      </div>
    );
  }

  return (
    <div className="list-page">
      <PageHeader
        title="Payout Grid Configuration"
        subtitle="Control which roles and POSPs can see payout grids"
      />

      <Card className="list-table-card">
        <ListDataSection isInitialLoading={loading} isRefreshing={false} stretch>
          <div className="config-section">
            <h3 className="section-title">Role-Based Visibility</h3>
            <p className="section-desc">
              Toggle insurer visibility per role. SUPER_ADMIN always sees everything.
            </p>

            <div className="config-table-scroll">
              <table className="config-table">
                <thead>
                  <tr>
                    <th>Role</th>
                    {insurers.map((ins) => (
                      <th key={ins.insurerSlug}>{ins.insurer}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ALL_ROLES.map((role) => (
                    <tr key={role}>
                      <td className="role-cell">{role}</td>
                      {insurers.map((ins) => {
                        const visible = isVisibleForRole(role, ins.insurerSlug);
                        return (
                          <td key={ins.insurerSlug} className="toggle-cell">
                            <button
                              type="button"
                              className={`toggle-btn ${visible ? "on" : "off"}`}
                              onClick={() =>
                                handleToggle("ROLE", role, ins.insurerSlug, visible)
                              }
                              title={visible ? "Visible — click to hide" : "Hidden — click to show"}
                            >
                              {visible ? "ON" : "OFF"}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="config-section">
            <h3 className="section-title">POSP-Level Overrides</h3>
            <p className="section-desc">
              Override visibility for specific POSPs. These take priority over role-level settings.
            </p>

            {pospOverrides.length > 0 && (
              <table className="config-table override-table">
                <thead>
                  <tr>
                    <th>POSP ID</th>
                    <th>Insurer</th>
                    <th>Visible</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pospOverrides.map((o) => (
                    <tr key={o.id}>
                      <td>{o.scopeValue}</td>
                      <td>{o.insurerSlug ?? "All"}</td>
                      <td>
                        <span className={`badge ${o.visible ? "badge-on" : "badge-off"}`}>
                          {o.visible ? "Visible" : "Hidden"}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-delete"
                          onClick={() => handleDeleteOverride(o.id)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="add-override-form">
              <input
                type="text"
                placeholder="Enter POSP ID..."
                value={pospSearch}
                onChange={(e) => setPospSearch(e.target.value)}
              />
              <select id="override-insurer-select" defaultValue="">
                <option value="">Select Insurer</option>
                {insurers.map((ins) => (
                  <option key={ins.insurerSlug} value={ins.insurerSlug}>
                    {ins.insurer}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn-add"
                disabled={!pospSearch.trim()}
                onClick={() => {
                  const sel = document.getElementById("override-insurer-select") as HTMLSelectElement;
                  if (pospSearch.trim() && sel.value) {
                    handleAddPospOverride(pospSearch.trim(), sel.value);
                    setPospSearch("");
                  }
                }}
              >
                Add Override (Hide)
              </button>
            </div>
          </div>
        </ListDataSection>
      </Card>

      <style jsx>{`
        .config-section {
          padding: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
        }
        .config-section:last-child {
          border-bottom: none;
        }
        .section-title {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 0.25rem;
        }
        .section-desc {
          font-size: 0.8125rem;
          color: #64748b;
          margin: 0 0 1rem;
        }
        .config-table-scroll {
          overflow-x: auto;
        }
        .config-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.8125rem;
        }
        .config-table th {
          background: #f8fafc;
          padding: 0.5rem 0.75rem;
          text-align: center;
          font-weight: 600;
          font-size: 0.75rem;
          text-transform: uppercase;
          color: #475569;
          border-bottom: 1px solid #e2e8f0;
          white-space: nowrap;
        }
        .config-table td {
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid #f1f5f9;
          text-align: center;
        }
        .role-cell {
          text-align: left !important;
          font-weight: 600;
          color: #334155;
        }
        .toggle-btn {
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.6875rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.15s;
        }
        .toggle-btn.on {
          background: #dcfce7;
          color: #16a34a;
        }
        .toggle-btn.on:hover {
          background: #bbf7d0;
        }
        .toggle-btn.off {
          background: #fee2e2;
          color: #dc2626;
        }
        .toggle-btn.off:hover {
          background: #fecaca;
        }
        .override-table {
          margin-bottom: 1rem;
        }
        .badge {
          padding: 0.125rem 0.5rem;
          border-radius: 1rem;
          font-size: 0.6875rem;
          font-weight: 600;
        }
        .badge-on {
          background: #dcfce7;
          color: #16a34a;
        }
        .badge-off {
          background: #fee2e2;
          color: #dc2626;
        }
        .btn-delete {
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          background: transparent;
          color: #dc2626;
          border: 1px solid #fecaca;
          cursor: pointer;
        }
        .btn-delete:hover {
          background: #fee2e2;
        }
        .add-override-form {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          flex-wrap: wrap;
        }
        .add-override-form input,
        .add-override-form select {
          padding: 0.5rem 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          font-size: 0.875rem;
        }
        .add-override-form input {
          min-width: 200px;
        }
        .btn-add {
          padding: 0.5rem 1rem;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 0.375rem;
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
        }
        .btn-add:hover {
          background: #dc2626;
        }
        .btn-add:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
