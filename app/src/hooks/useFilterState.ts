import { useCallback, useMemo, useState } from "react";
import {
  EMPTY_FILTERS,
  filterStateToParams,
  type FilterState,
} from "@/lib/filters/filter-utils";

export interface UseFilterStateReturn {
  filters: FilterState;
  /** Set a single filter key (instant — used for removing chips, clear-all, etc.) */
  setFilter: (key: keyof FilterState, value: string) => void;
  /** Atomically replace all filters at once (used by dialog Apply button) */
  applyFilters: (next: FilterState) => void;
  resetFilters: () => void;
  activeCount: number;
  queryParams: URLSearchParams;
}

/**
 * Centralized filter state management hook.
 * Tracks all filter dimensions and exposes helper methods.
 *
 * Usage:
 *   const { filters, setFilter, applyFilters, resetFilters, activeCount } = useFilterState();
 */
export function useFilterState(
  initial?: Partial<FilterState>,
): UseFilterStateReturn {
  const [filters, setFilters] = useState<FilterState>({
    ...EMPTY_FILTERS,
    ...initial,
  });

  /** Single key update with cascade clearing — used by chip × buttons */
  const setFilter = useCallback(
    (key: keyof FilterState, value: string) => {
      setFilters((prev) => {
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

  /** Atomically commit the full draft from the filter dialog */
  const applyFilters = useCallback((next: FilterState) => {
    setFilters(next);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ ...EMPTY_FILTERS, ...initial });
  }, [initial]);

  // Count how many non-default filters are active
  const activeCount = useMemo(() => {
    return Object.entries(filters).filter(([key, val]) => {
      const empty = EMPTY_FILTERS[key as keyof FilterState];
      return val !== empty && val !== "" && val !== "all";
    }).length;
  }, [filters]);

  const queryParams = useMemo(() => filterStateToParams(filters), [filters]);

  return { filters, setFilter, applyFilters, resetFilters, activeCount, queryParams };
}
