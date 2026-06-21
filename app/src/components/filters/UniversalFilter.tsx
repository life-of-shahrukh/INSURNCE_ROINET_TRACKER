"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FilterPopover } from "@/components/filters/FilterPopover";
import type { UserRole } from "@/lib/auth-types";
import type { ListQueryParams } from "@/lib/api/list-query-params";
import { crmApi } from "@/lib/api";
import { hierarchyApi } from "@/lib/api/hierarchy-api";
import { formatPospLabel } from "@/lib/posp-display";
import { geoCatalogApi } from "@/lib/api/geo-catalog-api";
import { useGeoCatalog } from "@/hooks/useGeoCatalog";
import type { FilterOption, FilterState, GeoDimensionOptions } from "@/lib/filters/filter-utils";
import { isManagerRoleGroupVisible } from "@/lib/filters/filter-visibility";
import {
  buildViewActiveFilterChips,
  countActiveFiltersForView,
  getViewFilterDimensions,
  getViewSearchPlaceholder,
  viewShowsSearch,
  type ListViewId,
  type QueryFilterKey,
} from "@/lib/filters/table-filter-config";

interface UniversalFilterProps {
  view: ListViewId;
  role: UserRole;
  query: ListQueryParams;
  filters: FilterState;
  applyViewFilters: (
    draftFilters: FilterState,
    draftQuery: Record<QueryFilterKey, string | undefined>,
  ) => void;
  onRemoveChip: (key: keyof FilterState | QueryFilterKey, value: string, source: "state" | "query") => void;
  onReset: () => void;
  search?: string;
  onSearchChange?: (val: string) => void;
}

const SEARCH_DEBOUNCE_MS = 300;

function FilterSearchInput({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}): React.ReactElement {
  const [draft, setDraft] = useState(value);
  const focusedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!focusedRef.current) {
      setDraft(value);
    }
  }, [value]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const scheduleCommit = useCallback(
    (next: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (next !== value) onChange(next);
      }, SEARCH_DEBOUNCE_MS);
    },
    [onChange, value],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value;
      setDraft(next);
      scheduleCommit(next);
    },
    [scheduleCommit],
  );

  const handleClear = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setDraft("");
    onChange("");
  }, [onChange]);

  return (
    <div className="filter-search">
      <input
        type="text"
        className="filter-search-input"
        placeholder={placeholder}
        value={draft}
        onChange={handleChange}
        onFocus={() => {
          focusedRef.current = true;
        }}
        onBlur={() => {
          focusedRef.current = false;
        }}
        aria-label="Search"
      />
      {draft.length > 0 && (
        <button
          type="button"
          className="filter-search-clear"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

export function UniversalFilter({
  view,
  role,
  query,
  filters,
  applyViewFilters,
  onRemoveChip,
  onReset,
  search,
  onSearchChange,
}: UniversalFilterProps): React.ReactElement {
  const [panelOpen, setPanelOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const { data: catalog } = useGeoCatalog();
  const { data: hierarchyOptions } = useQuery({
    queryKey: ["hierarchy", "filter-options"],
    queryFn: () => hierarchyApi.getFilterOptions(),
    enabled: view === "posp" && role !== "POSP",
    staleTime: 1000 * 60 * 5,
  });

  const geoOptions = useMemo<GeoDimensionOptions>(
    () => ({
      zones: (catalog?.zones ?? []).map((z) => ({ value: z.id, label: z.name })),
      regions: (catalog?.regions ?? []).map((r) => ({ value: r.id, label: r.name })),
      states: (catalog?.states ?? []).map((s) => ({ value: s.id, label: s.name })),
    }),
    [catalog],
  );

  const pospFilterOptions = useMemo(() => {
    if (view !== "posp" || !hierarchyOptions) return undefined;
    const managers: FilterOption[] = [];
    for (const group of hierarchyOptions.roleGroups) {
      if (!isManagerRoleGroupVisible(role, group.role)) continue;
      for (const member of group.members) {
        managers.push({
          value: member.id,
          label: `${member.name} (${group.label})`,
        });
      }
    }
    return { managerOptions: managers };
  }, [view, hierarchyOptions, role]);

  const dimensions = useMemo(
    () => getViewFilterDimensions(view, role, filters, geoOptions, pospFilterOptions),
    [view, role, filters, geoOptions, pospFilterOptions],
  );

  const activeCount = useMemo(
    () => countActiveFiltersForView(view, query, role),
    [view, query, role],
  );

  const activeChips = useMemo(
    () => buildViewActiveFilterChips(view, query, dimensions),
    [view, query, dimensions],
  );

  const queryValues = useMemo(
    (): Record<QueryFilterKey, string | undefined> => ({
      status: query.status,
      closureTimeline: query.closureTimeline,
      active: query.active,
      designation: query.designation,
      teamStatus: query.teamStatus,
      territory: query.territory,
      managerCode: query.managerCode,
    }),
    [query],
  );

  const handlePospSearch = useCallback(async (searchTerm: string): Promise<FilterOption[]> => {
    const params = new URLSearchParams({ search: searchTerm, pageSize: "20", page: "1" });
    const result = await crmApi.listPosp(params);
    return result.data.map((p) => ({
      value: p.id,
      label: formatPospLabel(p.name, p.code),
    }));
  }, []);

  const handleDistrictSearch = useCallback(async (searchTerm: string): Promise<FilterOption[]> => {
    const results = await geoCatalogApi.searchDistricts(searchTerm);
    return results.map((d) => ({
      value: d.id,
      label: d.stateName ? `${d.name} (${d.stateName})` : d.name,
    }));
  }, []);

  const handleCitySearch = useCallback(async (searchTerm: string): Promise<FilterOption[]> => {
    const results = await geoCatalogApi.searchCities(searchTerm);
    return results.map((c) => ({
      value: c.id,
      label: c.districtName ? `${c.name} (${c.districtName})` : c.name,
    }));
  }, []);

  const handleApplyFilters = useCallback(
    (
      draftFilters: FilterState,
      draftQuery: Record<QueryFilterKey, string | undefined>,
    ) => {
      applyViewFilters(draftFilters, draftQuery);
      setPanelOpen(false);
    },
    [applyViewFilters],
  );

  useEffect(() => {
    if (!panelOpen) return;

    const handlePointerDown = (event: MouseEvent): void => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (anchorRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setPanelOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setPanelOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [panelOpen]);

  const showSearch = viewShowsSearch(view) && onSearchChange !== undefined;
  const searchPlaceholder = getViewSearchPlaceholder(view);

  return (
    <div className="filter-bar">
      <div className="filter-strip">
        {showSearch && (
          <FilterSearchInput
            value={search ?? ""}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
          />
        )}

        <div className="filter-popover-anchor" ref={anchorRef}>
          <button
            type="button"
            className={`filter-strip-btn${panelOpen ? " filter-strip-btn--open" : ""}${activeCount > 0 ? " filter-strip-btn--active" : ""}`}
            onClick={() => setPanelOpen((open) => !open)}
            aria-expanded={panelOpen}
            aria-haspopup="dialog"
            aria-label={`Filters${activeCount > 0 ? `, ${activeCount} active` : ""}`}
          >
            <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path
                fillRule="evenodd"
                d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm2 5a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm2 5a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="filter-strip-btn-label">Filters</span>
            {activeCount > 0 && (
              <span className="filter-strip-badge">{activeCount}</span>
            )}
          </button>

          <FilterPopover
            ref={popoverRef}
            open={panelOpen}
            view={view}
            role={role}
            filters={filters}
            queryValues={queryValues}
            geoOptions={geoOptions}
            pospFilterOptions={pospFilterOptions}
            onApply={handleApplyFilters}
            onPospSearch={handlePospSearch}
            onDistrictSearch={handleDistrictSearch}
            onCitySearch={handleCitySearch}
          />
        </div>

        {activeChips.length > 0 && (
          <>
            <span className="filter-strip-divider" aria-hidden />
            <div className="filter-strip-tags">
              {activeChips.map((chip) => (
                <span key={`${chip.source}-${chip.key}-${chip.value}`} className="filter-tag">
                  <span className="filter-tag-label">{chip.label}</span>
                  <button
                    type="button"
                    className="filter-tag-remove"
                    onClick={() => onRemoveChip(chip.key, chip.value, chip.source)}
                    aria-label={`Remove ${chip.dimensionLabel} ${chip.label}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <button type="button" className="filter-strip-clear" onClick={onReset}>
              Clear
            </button>
          </>
        )}
      </div>
    </div>
  );
}
