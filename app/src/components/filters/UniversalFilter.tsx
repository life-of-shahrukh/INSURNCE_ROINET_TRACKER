"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { UserRole } from "@/lib/auth-types";
import {
  EMPTY_FILTERS,
  getVisibleDimensions,
  type FilterDimension,
  type FilterState,
} from "@/lib/filters/filter-utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface UniversalFilterProps {
  role: UserRole;
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  /** Atomic commit of full draft — called when the dialog Apply button is pressed */
  onApplyFilters: (next: FilterState) => void;
  onReset: () => void;
  activeCount: number;
  search?: string;
  onSearchChange?: (val: string) => void;
}

// ── Filter group metadata ─────────────────────────────────────────────────────

const FILTER_GROUPS = [
  {
    label: "Date & Time",
    icon: "📅",
    keys: ["dateRange", "dateFrom", "dateTo"] as (keyof FilterState)[],
  },
  {
    label: "Location",
    icon: "📍",
    keys: ["zone", "region", "area", "district"] as (keyof FilterState)[],
  },
  {
    label: "Sales Team",
    icon: "👥",
    keys: ["posp"] as (keyof FilterState)[],
  },
  {
    label: "Product",
    icon: "🛡️",
    keys: ["productLine", "productSubType", "insurer"] as (keyof FilterState)[],
  },
  {
    label: "Deal Metrics",
    icon: "📊",
    keys: ["dealStatus", "policyStatus", "premiumRange"] as (keyof FilterState)[],
  },
  {
    label: "Customer",
    icon: "🧑",
    keys: ["kycStatus", "source"] as (keyof FilterState)[],
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function FieldSelect({
  dim,
  draft,
  onChange,
}: {
  dim: FilterDimension;
  draft: FilterState;
  onChange: (k: keyof FilterState, v: string) => void;
}) {
  const val = draft[dim.key] as string;
  const active = val && val !== "all" && val !== "";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: active ? "#1d4ed8" : "#6b7280",
          textTransform: "uppercase",
          letterSpacing: "0.4px",
        }}
      >
        {dim.label}
      </label>
      <select
        value={val}
        onChange={(e) => onChange(dim.key, e.target.value)}
        style={{
          padding: "7px 10px",
          borderRadius: 7,
          border: `1.5px solid ${active ? "#3b82f6" : "#d1d5db"}`,
          fontSize: 13,
          background: active ? "#eff6ff" : "#fff",
          color: active ? "#1d4ed8" : "#374151",
          fontWeight: active ? 600 : 400,
          outline: "none",
          cursor: "pointer",
          width: "100%",
        }}
      >
        {dim.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function DateField({
  label,
  fieldKey,
  draft,
  onChange,
}: {
  label: string;
  fieldKey: "dateFrom" | "dateTo";
  draft: FilterState;
  onChange: (k: keyof FilterState, v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#6b7280",
          textTransform: "uppercase",
          letterSpacing: "0.4px",
        }}
      >
        {label}
      </label>
      <input
        type="date"
        value={draft[fieldKey]}
        onChange={(e) => onChange(fieldKey, e.target.value)}
        style={{
          padding: "7px 10px",
          borderRadius: 7,
          border: "1.5px solid #d1d5db",
          fontSize: 13,
          outline: "none",
          color: "#374151",
          width: "100%",
        }}
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function UniversalFilter({
  role,
  filters,
  onFilterChange,
  onApplyFilters,
  onReset,
  activeCount,
  search,
  onSearchChange,
}: UniversalFilterProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  // Draft state — only committed when user clicks "Apply"
  const [draft, setDraft] = useState<FilterState>(filters);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Sync draft when dialog opens
  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  // Close on backdrop click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const visibleDimensions = useMemo(
    () => getVisibleDimensions(role, draft),
    [role, draft],
  );

  const dimMap = useMemo(() => {
    const m: Record<string, FilterDimension> = {};
    visibleDimensions.forEach((d) => { m[d.key] = d; });
    return m;
  }, [visibleDimensions]);

  const handleDraftChange = useCallback(
    (key: keyof FilterState, value: string) => {
      setDraft((prev) => {
        const next = { ...prev, [key]: value };
        if (key === "productLine") next.productSubType = "";
        if (key === "zone")   { next.region = ""; next.area = ""; next.district = ""; next.posp = ""; }
        if (key === "region") { next.area = ""; next.district = ""; next.posp = ""; }
        if (key === "area")   { next.district = ""; next.posp = ""; }
        if (key === "district") next.posp = "";
        return next;
      });
    },
    [],
  );

  const handleApply = useCallback(() => {
    onApplyFilters(draft);
    setOpen(false);
  }, [draft, onApplyFilters]);

  const handleReset = useCallback(() => {
    setDraft(EMPTY_FILTERS);
  }, []);

  // Count active filters in draft for the Apply button label
  const draftActiveCount = useMemo(
    () =>
      (Object.keys(draft) as (keyof FilterState)[]).filter((k) => {
        const v = draft[k] as string;
        return v && v !== "" && v !== "all";
      }).length,
    [draft],
  );

  // Build active filter chips for the summary bar (committed filters)
  const activeChips = useMemo(() => {
    return visibleDimensions.filter((dim) => {
      const v = filters[dim.key] as string;
      return v && v !== "" && v !== "all";
    });
  }, [visibleDimensions, filters]);

  // Groups to render in dialog, only if they have at least one visible dim
  const groups = useMemo(() => {
    return FILTER_GROUPS.map((g) => ({
      ...g,
      dims: g.keys
        .filter((k) => k in dimMap)
        .map((k) => dimMap[k])
        .filter(Boolean) as FilterDimension[],
    })).filter((g) => g.dims.length > 0);
  }, [dimMap]);

  return (
    <>
      {/* ── Trigger row ──────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: activeChips.length > 0 ? 8 : 16,
          flexWrap: "wrap",
        }}
      >
        {/* Search (if provided) */}
        {onSearchChange !== undefined && (
          <input
            type="text"
            placeholder="Search…"
            value={search ?? ""}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              padding: "7px 12px",
              borderRadius: 8,
              border: "1.5px solid #d1d5db",
              fontSize: 13,
              outline: "none",
              width: 220,
              color: "#374151",
            }}
          />
        )}

        {/* Filters button */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 14px",
            borderRadius: 8,
            border: activeCount > 0 ? "1.5px solid #3b82f6" : "1.5px solid #d1d5db",
            background: activeCount > 0 ? "#eff6ff" : "#fff",
            color: activeCount > 0 ? "#1d4ed8" : "#374151",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm2 5a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm2 5a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
          Filters
          {activeCount > 0 && (
            <span
              style={{
                background: "#2563eb",
                color: "#fff",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                padding: "1px 7px",
                lineHeight: 1.4,
              }}
            >
              {activeCount}
            </span>
          )}
        </button>

        {/* Clear all — only shown when filters are active */}
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            style={{
              fontSize: 12,
              color: "#6b7280",
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
              padding: 0,
            }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* ── Active filter chips (AND summary) ───────────────────────────── */}
      {activeChips.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: 16,
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>
            Active:
          </span>
          {activeChips.map((dim, i) => {
            const val = filters[dim.key] as string;
            const label = dim.options.find((o) => o.value === val)?.label ?? val;
            return (
              <span
                key={dim.key}
                style={{ display: "inline-flex", alignItems: "center", gap: 0 }}
              >
                {i > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#6b7280",
                      margin: "0 4px",
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                    }}
                  >
                    AND
                  </span>
                )}
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                    background: "#dbeafe",
                    color: "#1d4ed8",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "3px 10px 3px 10px",
                    border: "1px solid #bfdbfe",
                  }}
                >
                  <span style={{ color: "#6b7280", fontWeight: 500, fontSize: 11 }}>
                    {dim.label}:
                  </span>
                  &nbsp;{label}
                  <button
                    type="button"
                    onClick={() => onFilterChange(dim.key, "")}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#93c5fd",
                      fontSize: 14,
                      lineHeight: 1,
                      padding: "0 0 0 2px",
                      marginLeft: 2,
                    }}
                  >
                    ×
                  </button>
                </span>
              </span>
            );
          })}
        </div>
      )}

      {/* ── Dialog (portal-like overlay) ─────────────────────────────────── */}
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 1000,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            paddingTop: "6vh",
            paddingBottom: "4vh",
            overflowY: "auto",
          }}
        >
          <div
            ref={dialogRef}
            style={{
              background: "#fff",
              borderRadius: 14,
              boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
              width: "min(700px, 96vw)",
              maxHeight: "88vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Dialog header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "18px 24px 14px",
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>
                  Filter Results
                </div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                  All conditions are combined with{" "}
                  <span
                    style={{
                      background: "#fef3c7",
                      color: "#92400e",
                      borderRadius: 4,
                      padding: "1px 6px",
                      fontWeight: 700,
                      fontSize: 11,
                    }}
                  >
                    AND
                  </span>{" "}
                  logic
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  background: "#f3f4f6",
                  border: "none",
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  fontSize: 18,
                  cursor: "pointer",
                  color: "#6b7280",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {/* Dialog body — scrollable */}
            <div
              style={{
                overflowY: "auto",
                padding: "20px 24px",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 24,
              }}
            >
              {groups.map((group) => (
                <section key={group.label}>
                  {/* Group heading */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      marginBottom: 12,
                      paddingBottom: 8,
                      borderBottom: "1px solid #f3f4f6",
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{group.icon}</span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#374151",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {group.label}
                    </span>
                  </div>

                  {/* Group fields */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                      gap: "12px 16px",
                    }}
                  >
                    {group.dims.map((dim) => (
                      <FieldSelect
                        key={dim.key}
                        dim={dim}
                        draft={draft}
                        onChange={handleDraftChange}
                      />
                    ))}

                    {/* Custom date pickers inside date group */}
                    {group.keys.includes("dateFrom") &&
                      draft.dateRange === "custom" && (
                        <>
                          <DateField
                            label="From"
                            fieldKey="dateFrom"
                            draft={draft}
                            onChange={handleDraftChange}
                          />
                          <DateField
                            label="To"
                            fieldKey="dateTo"
                            draft={draft}
                            onChange={handleDraftChange}
                          />
                        </>
                      )}
                  </div>
                </section>
              ))}
            </div>

            {/* Dialog footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 24px",
                borderTop: "1px solid #f3f4f6",
                background: "#fafafa",
              }}
            >
              <button
                type="button"
                onClick={handleReset}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1.5px solid #e5e7eb",
                  background: "#fff",
                  color: "#374151",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Reset all
              </button>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 8,
                    border: "1.5px solid #e5e7eb",
                    background: "#fff",
                    color: "#6b7280",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  style={{
                    padding: "8px 20px",
                    borderRadius: 8,
                    border: "none",
                    background: "#2563eb",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 1px 4px rgba(37,99,235,0.3)",
                  }}
                >
                  Apply{draftActiveCount > 0 ? ` (${draftActiveCount})` : ""}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
