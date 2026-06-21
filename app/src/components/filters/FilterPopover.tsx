"use client";

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FilterCategoryNav } from "@/components/filters/FilterCategoryNav";
import { FilterCategoryOptions } from "@/components/filters/FilterCategoryOptions";
import { getDimensionId } from "@/lib/filters/filter-dimension-utils";
import type { UserRole } from "@/lib/auth-types";
import {
  applyCascadeClear,
  isMultiFilterKey,
  type FilterOption,
  type FilterState,
  type GeoDimensionOptions,
} from "@/lib/filters/filter-utils";
import {
  getViewFilterDimensions,
  type ListViewId,
  type PospFilterOptions,
  type QueryFilterKey,
  type ViewFilterDimension,
} from "@/lib/filters/table-filter-config";

interface FilterPopoverProps {
  open: boolean;
  view: ListViewId;
  role: UserRole;
  filters: FilterState;
  queryValues: Record<QueryFilterKey, string | undefined>;
  geoOptions?: GeoDimensionOptions;
  pospFilterOptions?: PospFilterOptions;
  onApply: (
    filters: FilterState,
    queryValues: Record<QueryFilterKey, string | undefined>,
  ) => void;
  onPospSearch?: (query: string) => Promise<FilterOption[]>;
  onDistrictSearch?: (query: string) => Promise<FilterOption[]>;
  onCitySearch?: (query: string) => Promise<FilterOption[]>;
}

export const FilterPopover = forwardRef<HTMLDivElement, FilterPopoverProps>(
  function FilterPopover(
    {
      open,
      view,
      role,
      filters,
      queryValues,
      geoOptions,
      pospFilterOptions,
      onApply,
      onPospSearch,
      onDistrictSearch,
      onCitySearch,
    },
    ref,
  ): React.ReactElement | null {
    const [draftFilters, setDraftFilters] = useState<FilterState>(filters);
    const [draftQueryValues, setDraftQueryValues] =
      useState<Record<QueryFilterKey, string | undefined>>(queryValues);
    const wasOpenRef = useRef(false);

    useEffect(() => {
      if (open && !wasOpenRef.current) {
        setDraftFilters(filters);
        setDraftQueryValues(queryValues);
      }
      wasOpenRef.current = open;
    }, [open, filters, queryValues]);

    const dimensions = useMemo(
      (): ViewFilterDimension[] =>
        getViewFilterDimensions(view, role, draftFilters, geoOptions, pospFilterOptions),
      [view, role, draftFilters, geoOptions, pospFilterOptions],
    );

    const firstId = dimensions.length > 0 ? getDimensionId(dimensions[0]) : "";
    const [selectedId, setSelectedId] = useState(firstId);

    useEffect(() => {
      if (dimensions.length === 0) return;
      const ids = dimensions.map(getDimensionId);
      if (!ids.includes(selectedId)) {
        setSelectedId(ids[0]);
      }
    }, [dimensions, selectedId]);

    const selectedDimension = useMemo(
      () => dimensions.find((d) => getDimensionId(d) === selectedId) ?? dimensions[0],
      [dimensions, selectedId],
    );

    const handleDraftFilterChange = useCallback(
      (key: keyof FilterState, value: string | string[]): void => {
        setDraftFilters((prev) => {
          let next: FilterState = { ...prev };
          if (isMultiFilterKey(key)) {
            next = { ...next, [key]: value as string[] };
          } else {
            next = { ...next, [key]: value as string };
          }
          return applyCascadeClear(key, next);
        });
      },
      [],
    );

    const handleDraftQueryChange = useCallback((key: QueryFilterKey, value: string): void => {
      setDraftQueryValues((prev) => ({
        ...prev,
        [key]: value || undefined,
      }));
    }, []);

    const handleApply = useCallback((): void => {
      onApply(draftFilters, draftQueryValues);
    }, [draftFilters, draftQueryValues, onApply]);

    if (!open || dimensions.length === 0 || !selectedDimension) {
      return null;
    }

    return (
      <div ref={ref} className="filter-popover" role="dialog" aria-label="Filters">
        <div className="filter-popover-layout">
          <FilterCategoryNav
            dimensions={dimensions}
            selectedId={selectedId}
            filters={draftFilters}
            queryValues={draftQueryValues}
            onSelect={setSelectedId}
          />
          <div className="filter-popover-content">
            <FilterCategoryOptions
              dimension={selectedDimension}
              filters={draftFilters}
              queryValues={draftQueryValues}
              onFilterChange={handleDraftFilterChange}
              onQueryChange={handleDraftQueryChange}
              onPospSearch={onPospSearch}
              onDistrictSearch={onDistrictSearch}
              onCitySearch={onCitySearch}
            />
          </div>
        </div>
        <div className="filter-popover-footer">
          <button type="button" className="filter-popover-apply" onClick={handleApply}>
            Apply
          </button>
        </div>
      </div>
    );
  },
);
