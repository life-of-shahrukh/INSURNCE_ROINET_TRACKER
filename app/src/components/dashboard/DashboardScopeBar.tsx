"use client";

import { useHierarchyChildren } from "@/hooks/useHierarchyChildren";
import type {
  FilterOptionItem,
  HierarchyFilterOptions,
  SubordinatesResult,
} from "@/lib/api/hierarchy-api";
import type { UserRole } from "@/lib/auth-types";

// ── public types ─────────────────────────────────────────────────────────────

/** A selected manager in the drill-down cascade. `id` is the external code. */
export interface DrillItem {
  id: string;
  name: string;
  /** Role level of THIS item (NATIONAL_HEAD | ZH | RH | ASM | DM) */
  level: string;
}

export interface GeoFilter {
  stateId?: string;
  districtId?: string;
  cityId?: string;
}

/**
 * Current drill-down state of the dashboard scope bar.
 * - `path`: managers selected, broadest → narrowest (each carries its level)
 * - `posp`: terminal POSP selection
 * - `geo`: independent scoped geographic narrowing
 */
export interface DashboardScope {
  path: DrillItem[];
  posp?: { id: string; name: string };
  geo?: GeoFilter;
}

// ── helpers ──────────────────────────────────────────────────────────────────

const LEVEL_LABELS: Record<string, string> = {
  NATIONAL_HEAD: "National Heads",
  ZH: "Zone Heads",
  RH: "Regional Heads",
  ASM: "Area Managers",
  DM: "District Managers",
  POSP: "POSPs",
};

function allLabel(level: string | null): string {
  if (!level) return "All";
  return `All ${LEVEL_LABELS[level] ?? level}`;
}

const EMPTY_CHILDREN: SubordinatesResult = {
  nextLevel: null,
  members: [],
  posps: [],
};

// ── component ─────────────────────────────────────────────────────────────────

interface Props {
  role: UserRole | undefined;
  options: HierarchyFilterOptions;
  scope: DashboardScope;
  onChange: (scope: DashboardScope) => void;
}

/**
 * District-based cascading scope bar.
 *
 * The cascade always walks the full chain for the caller's role with no level
 * skipped and no siblings exposed:
 *   SA/NH → ZH → RH → ASM → DM → POSP   (each role starts one level below itself)
 *
 * "All <level>" (the empty option) aggregates that level; picking a particular
 * person narrows to their territory; Reset returns to the caller's own totals
 * ("Myself"). A second row offers scoped state/district/city filters.
 */
export function DashboardScopeBar({
  role,
  options,
  scope,
  onChange,
}: Props): React.ReactElement | null {
  const { path, posp, geo } = scope;

  const lv = (d: number): string | undefined => path[d]?.level;
  const id = (d: number): string | undefined => path[d]?.id;

  // Children of each selected manager (hooks always called; `enabled` gates them)
  const { data: c1 = EMPTY_CHILDREN } = useHierarchyChildren(lv(0), id(0));
  const { data: c2 = EMPTY_CHILDREN } = useHierarchyChildren(lv(1), id(1));
  const { data: c3 = EMPTY_CHILDREN } = useHierarchyChildren(lv(2), id(2));
  const { data: c4 = EMPTY_CHILDREN } = useHierarchyChildren(lv(3), id(3));
  const { data: c5 = EMPTY_CHILDREN } = useHierarchyChildren(lv(4), id(4));
  const children = [c1, c2, c3, c4, c5];

  if (!role || role === "POSP") return null;
  if (!options.nextLevel) return null;

  const hasDrill = path.length > 0 || !!posp;
  const hasGeo = !!(geo?.stateId || geo?.districtId || geo?.cityId);

  // ── event handlers ──────────────────────────────────────────────────────────

  function selectManager(item: FilterOptionItem, depth: number, level: string): void {
    onChange({
      ...scope,
      path: [...path.slice(0, depth), { id: item.id, name: item.name, level }],
      posp: undefined,
    });
  }

  function clearManagerFrom(depth: number): void {
    onChange({ ...scope, path: path.slice(0, depth), posp: undefined });
  }

  function selectPosp(item: FilterOptionItem): void {
    onChange({ ...scope, posp: { id: item.id, name: item.name } });
  }

  function clearPosp(): void {
    onChange({ ...scope, posp: undefined });
  }

  function setGeo(next: GeoFilter): void {
    onChange({ ...scope, geo: next });
  }

  function reset(): void {
    onChange({ path: [], posp: undefined, geo: undefined });
  }

  // ── render helpers ──────────────────────────────────────────────────────────

  function managerDropdown(
    items: FilterOptionItem[],
    level: string,
    selectedId: string | undefined,
    depth: number,
  ): React.ReactElement {
    return (
      <select
        key={`mgr-${depth}`}
        className="scope-bar__select"
        value={selectedId ?? ""}
        onChange={(e) => {
          if (!e.target.value) clearManagerFrom(depth);
          else {
            const found = items.find((i) => i.id === e.target.value);
            if (found) selectManager(found, depth, level);
          }
        }}
        aria-label={allLabel(level)}
      >
        <option value="">{allLabel(level)}</option>
        {items.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
    );
  }

  function pospDropdown(
    items: FilterOptionItem[],
    selectedId: string | undefined,
  ): React.ReactElement {
    return (
      <select
        key="posp-dropdown"
        className="scope-bar__select"
        value={selectedId ?? ""}
        onChange={(e) => {
          if (!e.target.value) clearPosp();
          else {
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

  /** Renders the dropdown at a given depth, choosing manager vs POSP. */
  function levelDropdown(depth: number): React.ReactElement | null {
    if (depth === 0) {
      if (options.nextLevel === "POSP") {
        return pospDropdown(options.subordinates, posp?.id);
      }
      return managerDropdown(
        options.subordinates,
        options.nextLevel as string,
        id(0),
        0,
      );
    }
    // Deeper levels require the parent to be selected.
    if (!id(depth - 1)) return null;
    const c = children[depth - 1];
    if (c.nextLevel === "POSP") return pospDropdown(c.posps, posp?.id);
    if (c.members.length > 0) {
      return managerDropdown(c.members, c.nextLevel as string, id(depth), depth);
    }
    return null;
  }

  function geoSelect(
    label: string,
    items: FilterOptionItem[],
    selected: string | undefined,
    apply: (value: string | undefined) => void,
  ): React.ReactElement | null {
    if (items.length === 0) return null;
    return (
      <select
        className="scope-bar__select"
        value={selected ?? ""}
        onChange={(e) => apply(e.target.value || undefined)}
        aria-label={`All ${label}`}
      >
        <option value="">{`All ${label}`}</option>
        {items.map((it) => (
          <option key={it.id} value={it.id}>
            {it.name}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="scope-bar">
      <span className="scope-bar__label">Viewing:</span>
      {levelDropdown(0)}
      {levelDropdown(1)}
      {levelDropdown(2)}
      {levelDropdown(3)}
      {levelDropdown(4)}

      <span className="scope-bar__label">Filter:</span>
      {geoSelect("States", options.states, geo?.stateId, (v) =>
        setGeo({ stateId: v }),
      )}
      {geoSelect("Districts", options.districts, geo?.districtId, (v) =>
        setGeo({ ...geo, districtId: v, cityId: undefined }),
      )}
      {geoSelect("Cities", options.cities, geo?.cityId, (v) =>
        setGeo({ ...geo, cityId: v, districtId: undefined }),
      )}

      {(hasDrill || hasGeo) && (
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
