"use client";

import type { HierarchyFilterOptions } from "@/lib/api/hierarchy-api";
import type { UserRole } from "@/lib/auth-types";
import { hasMinRole } from "@/lib/auth-types";

export interface DashboardScope {
  subordinateId?: string;
  zone?: string;
  region?: string;
  area?: string;
  district?: string;
}

interface Props {
  role: UserRole | undefined;
  options: HierarchyFilterOptions;
  scope: DashboardScope;
  onChange: (scope: DashboardScope) => void;
}

/**
 * A horizontal bar that allows managers and above to drill down into
 * a specific team member's territory or filter by geography.
 * POSP users see nothing — the bar is hidden.
 */
export function DashboardScopeBar({ role, options, scope, onChange }: Props): React.ReactElement | null {
  // POSPs see their own data only — no scope controls needed
  if (!role || role === "POSP") return null;

  const isManager = hasMinRole(role, "ASM");

  function set(partial: Partial<DashboardScope>): void {
    onChange({ ...scope, ...partial });
  }

  function reset(): void {
    onChange({});
  }

  const hasDrill =
    scope.subordinateId ||
    scope.zone ||
    scope.region ||
    scope.area ||
    scope.district;

  return (
    <div className="scope-bar">
      <span className="scope-bar__label">Viewing:</span>

      {/* Subordinate people selector (ASM+) */}
      {isManager && options.subordinates.length > 0 && (
        <select
          className="scope-bar__select"
          value={scope.subordinateId ?? ""}
          onChange={(e) => set({ subordinateId: e.target.value || undefined })}
          aria-label="Drill into team member"
        >
          <option value="">All team members</option>
          {options.subordinates.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      )}

      {/* Zone */}
      {options.zones.length > 0 && (
        <select
          className="scope-bar__select"
          value={scope.zone ?? ""}
          onChange={(e) =>
            set({ zone: e.target.value || undefined, region: undefined, area: undefined, district: undefined })
          }
          aria-label="Zone"
        >
          <option value="">All zones</option>
          {options.zones.map((z) => (
            <option key={z.id} value={z.id}>
              {z.name}
            </option>
          ))}
        </select>
      )}

      {/* Region — cascade: only show when zone selected or always if few zones */}
      {options.regions.length > 0 && (
        <select
          className="scope-bar__select"
          value={scope.region ?? ""}
          onChange={(e) =>
            set({ region: e.target.value || undefined, area: undefined, district: undefined })
          }
          aria-label="Region"
        >
          <option value="">All regions</option>
          {options.regions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      )}

      {/* Area */}
      {options.areas.length > 0 && (
        <select
          className="scope-bar__select"
          value={scope.area ?? ""}
          onChange={(e) =>
            set({ area: e.target.value || undefined, district: undefined })
          }
          aria-label="Area"
        >
          <option value="">All areas</option>
          {options.areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      )}

      {/* District */}
      {options.districts.length > 0 && (
        <select
          className="scope-bar__select"
          value={scope.district ?? ""}
          onChange={(e) => set({ district: e.target.value || undefined })}
          aria-label="District"
        >
          <option value="">All districts</option>
          {options.districts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
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
