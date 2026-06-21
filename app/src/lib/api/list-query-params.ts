import {
  EMPTY_FILTERS,
  MULTI_FILTER_KEYS,
  countFilterSelections,
  filterStateToParams,
  parseMultiFromParams,
  type FilterState,
} from "@/lib/filters/filter-utils";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from "./pagination-types";

export interface ListQueryParams extends FilterState {
  page: number;
  pageSize: number;
  search: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: string;
  closureTimeline?: string;
  active?: string;
  designation?: string;
  teamStatus?: string;
  territory?: string;
  renewals?: string;
  managerCode?: string;
}

export const DEFAULT_LIST_QUERY: ListQueryParams = {
  ...EMPTY_FILTERS,
  page: DEFAULT_PAGE,
  pageSize: DEFAULT_PAGE_SIZE,
  search: "",
};

const SINGLE_FILTER_KEYS = ["dateRange", "dateFrom", "dateTo", "premiumRange"] as const;

const EXTRA_KEYS = [
  "page",
  "pageSize",
  "search",
  "sortBy",
  "sortOrder",
  "status",
  "closureTimeline",
  "active",
  "designation",
  "teamStatus",
  "territory",
  "renewals",
  "managerCode",
] as const;

export function parseListQueryFromSearchParams(
  params: URLSearchParams,
  defaults?: Partial<ListQueryParams>,
): ListQueryParams {
  const base: ListQueryParams = { ...DEFAULT_LIST_QUERY, ...defaults };

  for (const key of SINGLE_FILTER_KEYS) {
    const val = params.get(key);
    if (val !== null && val !== "") {
      base[key] = val;
    }
  }

  for (const key of MULTI_FILTER_KEYS) {
    base[key] = parseMultiFromParams(params, key);
  }

  for (const key of EXTRA_KEYS) {
    const val = params.get(key);
    if (val !== null && val !== "") {
      if (key === "page") base.page = Math.max(1, Number(val) || DEFAULT_PAGE);
      else if (key === "pageSize") base.pageSize = Math.min(100, Math.max(1, Number(val) || DEFAULT_PAGE_SIZE));
      else if (key === "search") base.search = val;
      else if (key === "status") base.status = val;
      else if (key === "closureTimeline") base.closureTimeline = val;
      else if (key === "active") base.active = val;
      else if (key === "designation") base.designation = val;
      else if (key === "teamStatus") base.teamStatus = val;
      else if (key === "territory") base.territory = val;
      else if (key === "renewals") base.renewals = val;
      else if (key === "managerCode") base.managerCode = val;
    }
  }

  return base;
}

export function listQueryToSearchParams(query: ListQueryParams): URLSearchParams {
  const params = filterStateToParams(query);

  params.set("page", String(query.page));
  params.set("pageSize", String(query.pageSize));

  if (query.search.trim()) params.set("search", query.search.trim());
  if (query.sortBy) params.set("sortBy", query.sortBy);
  if (query.sortOrder) params.set("sortOrder", query.sortOrder);
  if (query.status) params.set("status", query.status);
  if (query.closureTimeline) params.set("closureTimeline", query.closureTimeline);
  if (query.active) params.set("active", query.active);
  if (query.designation) params.set("designation", query.designation);
  if (query.teamStatus) params.set("teamStatus", query.teamStatus);
  if (query.territory) params.set("territory", query.territory);
  if (query.renewals) params.set("renewals", query.renewals);
  if (query.managerCode) params.set("managerCode", query.managerCode);

  return params;
}

export function listQueryToApiParams(query: ListQueryParams): URLSearchParams {
  const params = listQueryToSearchParams(query);
  if (query.teamStatus) {
    params.set("status", query.teamStatus);
    params.delete("teamStatus");
  }
  return params;
}

export function countActiveFilters(query: ListQueryParams): number {
  let count = countFilterSelections(query);
  if (query.status) count++;
  if (query.closureTimeline) count++;
  if (query.active) count++;
  if (query.designation) count++;
  if (query.teamStatus) count++;
  if (query.territory) count++;
  if (query.renewals) count++;
  if (query.managerCode) count++;
  return count;
}
