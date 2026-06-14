"use client";

import { useHierarchyChildren } from "@/hooks/useHierarchyChildren";
import type { FilterOptionItem, HierarchyFilterOptions } from "@/lib/api/hierarchy-api";
import type { UserRole } from "@/lib/auth-types";

// ── public types ─────────────────────────────────────────────────────────────

export interface DrillItem {
  id: string;
  name: string;
  designation?: string;
}

/**
 * Represents the current drill-down state of the dashboard scope bar.
 * salesTeamPath: ordered from broadest → narrowest SalesTeam selection
 * posp: terminal POSP selection (set at the leaf of the cascade)
 */
export interface DashboardScope {
  salesTeamPath: DrillItem[];
  posp?: DrillItem;
}

// ── helpers ──────────────────────────────────────────────────────────────────

const DESIGNATION_LABELS: Record<string, string> = {
  ZH: "Zone Heads",
  RH: "Regional Heads",
  ASM: "Area Managers",
  DM: "District Managers",
};

function allLabel(items: FilterOptionItem[], fallback = "Team Members"): string {
  const desig = items[0]?.designation;
  const label = desig ? (DESIGNATION_LABELS[desig] ?? desig) : fallback;
  return `All ${label}`;
}

// ── component ─────────────────────────────────────────────────────────────────

interface Props {
  role: UserRole | undefined;
  options: HierarchyFilterOptions;
  scope: DashboardScope;
  onChange: (scope: DashboardScope) => void;
}

/**
 * Cascading role-aware scope bar.
 *
 * - POSP: bar hidden (they only see their own data).
 * - DM: shows direct POSP dropdown (no SalesTeam sub-level).
 * - ASM: shows DMs, then after DM selected → shows POSPs.
 * - RH: shows ASMs → DMs → POSPs.
 * - ZH: shows RHs → ASMs → DMs → POSPs.
 * - SA/NH: shows ZHs → RHs → ASMs → DMs → POSPs.
 *
 * Selecting any level immediately re-filters the dashboard and exposes the
 * next dropdown. Changing a higher-level selection clears all deeper ones.
 */
export function DashboardScopeBar({
  role,
  options,
  scope,
  onChange,
}: Props): React.ReactElement | null {
  const { salesTeamPath, posp } = scope;

  // IDs at each path level (used as query keys for child fetches)
  const id0 = salesTeamPath[0]?.id;
  const id1 = salesTeamPath[1]?.id;
  const id2 = salesTeamPath[2]?.id;
  const id3 = salesTeamPath[3]?.id;

  // Hooks are always called (React rules) — `enabled` prevents actual fetches
  const { data: c1 = { members: [], posps: [] } } = useHierarchyChildren(id0);
  const { data: c2 = { members: [], posps: [] } } = useHierarchyChildren(id1);
  const { data: c3 = { members: [], posps: [] } } = useHierarchyChildren(id2);
  const { data: c4 = { members: [], posps: [] } } = useHierarchyChildren(id3);

  if (!role || role === "POSP") return null;

  // DM case: no SalesTeam subordinates; show POSPs directly at L0
  const isDmMode =
    options.subordinates.length === 0 && options.posps.length > 0;

  // Nothing to show at all
  if (!isDmMode && options.subordinates.length === 0) return null;

  const hasDrill = salesTeamPath.length > 0 || !!posp;

  // ── event handlers ──────────────────────────────────────────────────────────

  function selectSalesTeam(item: FilterOptionItem, depth: number): void {
    onChange({
      salesTeamPath: [
        ...salesTeamPath.slice(0, depth),
        { id: item.id, name: item.name, designation: item.designation },
      ],
      posp: undefined,
    });
  }

  function clearFromDepth(depth: number): void {
    onChange({ salesTeamPath: salesTeamPath.slice(0, depth), posp: undefined });
  }

  function selectPosp(item: FilterOptionItem): void {
    onChange({ salesTeamPath, posp: { id: item.id, name: item.name } });
  }

  function clearPosp(): void {
    onChange({ salesTeamPath, posp: undefined });
  }

  function reset(): void {
    onChange({ salesTeamPath: [], posp: undefined });
  }

  // ── render helpers ──────────────────────────────────────────────────────────

  function renderSalesTeamDropdown(
    items: FilterOptionItem[],
    selectedId: string | undefined,
    depth: number,
  ): React.ReactElement {
    return (
      <select
        key={`st-${depth}`}
        className="scope-bar__select"
        value={selectedId ?? ""}
        onChange={(e) => {
          if (!e.target.value) {
            clearFromDepth(depth);
          } else {
            const found = items.find((i) => i.id === e.target.value);
            if (found) selectSalesTeam(found, depth);
          }
        }}
        aria-label={allLabel(items)}
      >
        <option value="">{allLabel(items)}</option>
        {items.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
    );
  }

  function renderPospDropdown(
    items: FilterOptionItem[],
    selectedId: string | undefined,
  ): React.ReactElement {
    return (
      <select
        key="posp-dropdown"
        className="scope-bar__select"
        value={selectedId ?? ""}
        onChange={(e) => {
          if (!e.target.value) {
            clearPosp();
          } else {
            const found = items.find((i) => i.id === e.target.value);
            if (found) selectPosp(found);
          }
        }}
        aria-label="All POSPs"
      >
        <option value="">All POSPs</option>
        {items.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    );
  }

  // ── cascade rendering ────────────────────────────────────────────────────────
  //
  // Level 0 (L0): options.subordinates (SA/NH/ZH/RH/ASM) or options.posps (DM)
  // Level 1–4: children of the previously selected SalesTeam member
  //
  // Each SalesTeam level: rendered when parent has a selection
  // POSP level: rendered when children.members === 0 && children.posps > 0

  return (
    <div className="scope-bar">
      <span className="scope-bar__label">Viewing:</span>

      {/* L0 */}
      {isDmMode
        ? renderPospDropdown(options.posps, posp?.id)
        : renderSalesTeamDropdown(options.subordinates, id0, 0)}

      {/* L1: shown after L0 SalesTeam selection */}
      {!isDmMode && id0 && (
        c1.members.length > 0
          ? renderSalesTeamDropdown(c1.members, id1, 1)
          : c1.posps.length > 0
            ? renderPospDropdown(c1.posps, posp?.id)
            : null
      )}

      {/* L2: shown after L1 SalesTeam selection */}
      {!isDmMode && id1 && (
        c2.members.length > 0
          ? renderSalesTeamDropdown(c2.members, id2, 2)
          : c2.posps.length > 0
            ? renderPospDropdown(c2.posps, posp?.id)
            : null
      )}

      {/* L3: shown after L2 SalesTeam selection */}
      {!isDmMode && id2 && (
        c3.members.length > 0
          ? renderSalesTeamDropdown(c3.members, id3, 3)
          : c3.posps.length > 0
            ? renderPospDropdown(c3.posps, posp?.id)
            : null
      )}

      {/* L4: shown after L3 SalesTeam selection */}
      {!isDmMode && id3 && (
        c4.members.length > 0
          ? renderSalesTeamDropdown(c4.members, undefined, 4)
          : c4.posps.length > 0
            ? renderPospDropdown(c4.posps, posp?.id)
            : null
      )}

      {hasDrill && (
        <button
          type="button"
          className="scope-bar__reset"
          onClick={reset}
          aria-label="Reset scope filters"
        >
          ✕ Reset
        </button>
      )}
    </div>
  );
}
