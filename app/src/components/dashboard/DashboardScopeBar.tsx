"use client";

import { useGeoCatalog } from "@/hooks/useGeoCatalog";
import { geoCatalogApi } from "@/lib/api/geo-catalog-api";
import type {
  FilterOptionItem,
  HierarchyFilterOptions,
} from "@/lib/api/hierarchy-api";
import type { UserRole } from "@/lib/auth-types";
import {
  isGeoFilterVisible,
} from "@/lib/filters/filter-visibility";
import { ScopeAsyncSelect, type GeoOption } from "./ScopeAsyncSelect";

// ── public types ─────────────────────────────────────────────────────────────

export interface GeoFilter {
  zoneId?: string;
  regionId?: string;
  stateId?: string;
  districtId?: string;
  cityId?: string;
}

/** Current drill-down state of the dashboard scope bar. */
export interface DashboardScope {
  geo?: GeoFilter;
  /** `id` is userCode for managers, posp DB id when role is POSP. */
  manager?: { id: string; name: string; role: string };
}

// ── component ─────────────────────────────────────────────────────────────────

interface Props {
  role: UserRole | undefined;
  options: HierarchyFilterOptions;
  scope: DashboardScope;
  onChange: (scope: DashboardScope) => void;
}

/**
 * Dashboard scope bar — role-group filters plus scoped geographic narrowing.
 * "All <level>" aggregates that level; picking a person narrows to their
 * territory; Reset returns to the caller's own totals.
 */
export function DashboardScopeBar({
  role,
  options,
  scope,
  onChange,
}: Props): React.ReactElement | null {
  const { geo, manager } = scope;

  const { data: catalog } = useGeoCatalog();

  const { roleGroups: showRoleGroups, geo: showGeo } = options.filterMode;

  if (!role || role === "POSP") return null;
  if (!showRoleGroups && !showGeo) return null;

  const hasRole = !!manager;
  const hasGeo = !!(
    geo?.zoneId ||
    geo?.regionId ||
    geo?.stateId ||
    geo?.districtId ||
    geo?.cityId
  );

  function selectByRole(item: FilterOptionItem, role: string): void {
    onChange({
      ...scope,
      manager: { id: item.id, name: item.name, role },
    });
  }

  function clearRole(): void {
    onChange({ ...scope, manager: undefined });
  }

  function setGeo(next: GeoFilter): void {
    onChange({ ...scope, geo: next });
  }

  function reset(): void {
    onChange({ manager: undefined, geo: undefined });
  }

  async function districtOptions(q: string): Promise<GeoOption[]> {
    const results = await geoCatalogApi.searchDistricts(q, {
      stateId: geo?.stateId,
      zoneId: geo?.zoneId,
      regionId: geo?.regionId,
    });
    return results.map((d) => ({
      id: d.id,
      name: d.stateName ? `${d.name} (${d.stateName})` : d.name,
    }));
  }

  async function cityOptions(q: string): Promise<GeoOption[]> {
    const results = await geoCatalogApi.searchCities(q, {
      districtId: geo?.districtId,
      stateId: geo?.stateId,
    });
    return results.map((c) => ({
      id: c.id,
      name: c.districtName ? `${c.name} (${c.districtName})` : c.name,
    }));
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

  function roleDropdown(
    role: string,
    label: string,
    items: FilterOptionItem[],
  ): React.ReactElement {
    const selectedId = manager?.role === role ? manager.id : "";
    return (
      <select
        key={`role-${role}`}
        className="scope-bar__select"
        value={selectedId}
        onChange={(e) => {
          if (!e.target.value) clearRole();
          else {
            const found = items.find((i) => i.id === e.target.value);
            if (found) selectByRole(found, role);
          }
        }}
        aria-label={`All ${label}`}
      >
        <option value="">{`All ${label}`}</option>
        {items.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
    );
  }

  const visibleRoleGroups = showRoleGroups ? options.roleGroups : [];

  const activeFilter = manager
    ? `${manager.name}${manager.role ? ` (${manager.role})` : ""}`
    : null;

  return (
    <div className="scope-bar">
      {visibleRoleGroups.length > 0 && (
        <>
          <span className="scope-bar__label">Filter by role:</span>
          {visibleRoleGroups.map((g) =>
            roleDropdown(g.role, g.label, g.members),
          )}
        </>
      )}

      {activeFilter && (
        <div className="scope-bar__active-filter">
          <span className="scope-bar__active-label">
            Viewing data for: <strong>{activeFilter}</strong>
          </span>
        </div>
      )}

      <span className="scope-bar__label">Geographic filters:</span>
      {showGeo && isGeoFilterVisible(role, "zone") &&
        geoSelect("Zones", catalog?.zones ?? [], geo?.zoneId, (v) =>
          setGeo({ zoneId: v }),
        )}
      {showGeo && isGeoFilterVisible(role, "region") &&
        geoSelect("Regions", catalog?.regions ?? [], geo?.regionId, (v) =>
          setGeo({ regionId: v }),
        )}
      {showGeo && isGeoFilterVisible(role, "state") &&
        geoSelect("States", catalog?.states ?? [], geo?.stateId, (v) =>
          setGeo({ stateId: v }),
        )}
      {showGeo && isGeoFilterVisible(role, "district") && (
        <ScopeAsyncSelect
          placeholder="Search districts…"
          selectedId={geo?.districtId}
          onSearch={(q) => districtOptions(q)}
          onSelect={(item) =>
            setGeo({ ...geo, districtId: item?.id, cityId: undefined })
          }
        />
      )}
      {showGeo && isGeoFilterVisible(role, "city") && (
        <ScopeAsyncSelect
          placeholder="Search cities…"
          selectedId={geo?.cityId}
          onSearch={(q) => cityOptions(q)}
          onSelect={(item) => setGeo({ ...geo, cityId: item?.id })}
        />
      )}

      {(hasRole || hasGeo) && (
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
