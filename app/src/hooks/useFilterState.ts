import { useCallback, useMemo, useState } from "react";
import {
  applyCascadeClear,
  countFilterSelections,
  EMPTY_FILTERS,
  filterStateToParams,
  isMultiFilterKey,
  type FilterState,
} from "@/lib/filters/filter-utils";

export interface UseFilterStateReturn {
  filters: FilterState;
  setFilter: (key: keyof FilterState, value: string | string[]) => void;
  applyFilters: (next: FilterState) => void;
  resetFilters: () => void;
  activeCount: number;
  queryParams: URLSearchParams;
}

export function useFilterState(
  initial?: Partial<FilterState>,
): UseFilterStateReturn {
  const [filters, setFilters] = useState<FilterState>({
    ...EMPTY_FILTERS,
    ...initial,
  });

  const setFilter = useCallback(
    (key: keyof FilterState, value: string | string[]) => {
      setFilters((prev) => {
        let next: FilterState = { ...prev, [key]: value } as FilterState;
        if (isMultiFilterKey(key)) {
          next = applyCascadeClear(key, next);
        }
        return next;
      });
    },
    [],
  );

  const applyFilters = useCallback((next: FilterState) => {
    setFilters(next);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ ...EMPTY_FILTERS, ...initial });
  }, [initial]);

  const activeCount = useMemo(() => countFilterSelections(filters), [filters]);
  const queryParams = useMemo(() => filterStateToParams(filters), [filters]);

  return { filters, setFilter, applyFilters, resetFilters, activeCount, queryParams };
}
