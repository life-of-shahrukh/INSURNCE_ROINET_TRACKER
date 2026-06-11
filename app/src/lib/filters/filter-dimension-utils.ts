import { isMultiFilterKey, type FilterState } from "./filter-utils";
import type { QueryFilterKey, ViewFilterDimension } from "./table-filter-config";

export function getDimensionId(dim: ViewFilterDimension): string {
  return dim.queryKey ?? String(dim.key);
}

export function isDimensionActive(
  dim: ViewFilterDimension,
  filters: FilterState,
  queryValues: Record<QueryFilterKey, string | undefined>,
): boolean {
  if (dim.queryKey) {
    const val = queryValues[dim.queryKey];
    return val !== undefined && val !== "";
  }

  if (isMultiFilterKey(dim.key)) {
    return filters[dim.key].length > 0;
  }

  if (dim.key === "dateRange") {
    if (filters.dateRange === "custom") {
      return filters.dateFrom !== "" || filters.dateTo !== "";
    }
    return filters.dateRange !== "all" && filters.dateRange !== "";
  }

  if (dim.key === "premiumRange") {
    return filters.premiumRange !== "";
  }

  return false;
}
