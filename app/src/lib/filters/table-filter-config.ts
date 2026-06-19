import type { UserRole } from "@/lib/auth-types";
import type { ListQueryParams } from "@/lib/api/list-query-params";
import { listQueryToSearchParams } from "@/lib/api/list-query-params";
import {
  EMPTY_FILTERS,
  getVisibleDimensions,
  isMultiFilterKey,
  type FilterDimension,
  type FilterOption,
  type FilterState,
  type GeoDimensionOptions,
} from "./filter-utils";
import { getCachedOptionLabel } from "./option-label-cache";

/** Identifies which list/table the filter bar belongs to */
export type ListViewId =
  | "deals"
  | "customers"
  | "leads"
  | "posp"
  | "sales-team"
  | "renewals"
  | "commissions"
  | "reports";

export type QueryFilterKey =
  | "status"
  | "closureTimeline"
  | "active"
  | "designation"
  | "teamStatus"
  | "territory";

export interface ViewFilterDimension extends FilterDimension {
  queryKey?: QueryFilterKey;
}

type FilterFieldRef =
  | { type: "state"; key: keyof FilterState; label?: string }
  | { type: "query"; key: QueryFilterKey; label: string };

export interface ListViewFilterConfig {
  fields: FilterFieldRef[];
  searchPlaceholder?: string;
  showSearch?: boolean;
}

const LEAD_STATUS_OPTIONS: FilterOption[] = [
  { value: "", label: "All Statuses" },
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "PROPOSAL_SENT", label: "Proposal Sent" },
  { value: "WON", label: "Won" },
  { value: "LOST", label: "Lost" },
];

const CLOSURE_TIMELINE_OPTIONS: FilterOption[] = [
  { value: "", label: "All Timelines" },
  { value: "THIS_MONTH", label: "This Month" },
  { value: "T_PLUS_1", label: "T+1" },
  { value: "T_PLUS_2", label: "T+2" },
  { value: "LATER", label: "Later" },
];

const POSP_ACTIVE_OPTIONS: FilterOption[] = [
  { value: "", label: "All" },
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

const DESIGNATION_OPTIONS: FilterOption[] = [
  { value: "", label: "All Designations" },
  { value: "ASM", label: "ASM" },
  { value: "ZH", label: "ZH" },
  { value: "RH", label: "RH" },
  { value: "SM", label: "SM" },
];

const TEAM_STATUS_OPTIONS: FilterOption[] = [
  { value: "", label: "All Statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "ON_LEAVE", label: "On Leave" },
];

const QUERY_FILTER_DEFS: Record<
  QueryFilterKey,
  { label: string; options: FilterOption[] }
> = {
  status: { label: "Status", options: LEAD_STATUS_OPTIONS },
  closureTimeline: { label: "Timeline", options: CLOSURE_TIMELINE_OPTIONS },
  active: { label: "Status", options: POSP_ACTIVE_OPTIONS },
  designation: { label: "Designation", options: DESIGNATION_OPTIONS },
  teamStatus: { label: "Status", options: TEAM_STATUS_OPTIONS },
  territory: { label: "Territory", options: [] },
};

const GEO_FIELDS: FilterFieldRef[] = [
  { type: "state", key: "zone", label: "Zone" },
  { type: "state", key: "region", label: "Region" },
  { type: "state", key: "state", label: "State" },
  { type: "state", key: "district", label: "District" },
  { type: "state", key: "city", label: "City" },
];

/** Filter fields ordered to mirror each table's columns / card fields */
export const TABLE_FILTER_CONFIG: Record<ListViewId, ListViewFilterConfig> = {
  deals: {
    showSearch: true,
    searchPlaceholder: "Customer, policy, proposal…",
    fields: [
      { type: "state", key: "posp", label: "POSP" },
      { type: "state", key: "productLine", label: "Policy" },
      { type: "state", key: "productSubType", label: "Sub-Type" },
      { type: "state", key: "insurer", label: "Insurer" },
      { type: "state", key: "dealStatus", label: "Status" },
      { type: "state", key: "premiumRange", label: "Premium" },
      { type: "state", key: "policyStatus", label: "Issued" },
      { type: "state", key: "dateRange", label: "Expected" },
      ...GEO_FIELDS,
    ],
  },
  renewals: {
    showSearch: true,
    searchPlaceholder: "Customer, policy #…",
    fields: [
      { type: "state", key: "posp", label: "POSP" },
      { type: "state", key: "productLine", label: "Type" },
      { type: "state", key: "premiumRange", label: "Premium" },
      { type: "state", key: "dateRange", label: "Issued" },
      ...GEO_FIELDS,
    ],
  },
  commissions: {
    showSearch: true,
    searchPlaceholder: "Customer, policy…",
    fields: [
      { type: "state", key: "posp", label: "POSP" },
      { type: "state", key: "dealStatus", label: "Status" },
      { type: "state", key: "productLine", label: "Policy" },
      { type: "state", key: "premiumRange", label: "Premium" },
      { type: "state", key: "policyStatus", label: "Issued" },
      { type: "state", key: "dateRange", label: "Expected" },
      ...GEO_FIELDS,
    ],
  },
  reports: {
    showSearch: true,
    searchPlaceholder: "Customer, policy…",
    fields: [
      { type: "state", key: "posp", label: "POSP" },
      { type: "state", key: "dealStatus", label: "Status" },
      { type: "state", key: "productLine", label: "Policy" },
      { type: "state", key: "premiumRange", label: "Premium" },
      { type: "state", key: "policyStatus", label: "Issued" },
      { type: "state", key: "dateRange", label: "Expected" },
      ...GEO_FIELDS,
    ],
  },
  customers: {
    showSearch: true,
    searchPlaceholder: "Name, mobile, email…",
    fields: [
      { type: "state", key: "kycStatus", label: "KYC Status" },
      { type: "state", key: "source", label: "Source" },
      { type: "state", key: "dateRange", label: "Created" },
      ...GEO_FIELDS,
    ],
  },
  leads: {
    showSearch: true,
    searchPlaceholder: "Customer, product…",
    fields: [
      { type: "state", key: "productLine", label: "Product" },
      { type: "state", key: "productSubType", label: "Sub-Type" },
      { type: "state", key: "source", label: "Source" },
      { type: "query", key: "status", label: "Status" },
      { type: "query", key: "closureTimeline", label: "Timeline" },
      { type: "state", key: "dateRange", label: "Created" },
      ...GEO_FIELDS,
    ],
  },
  posp: {
    showSearch: true,
    searchPlaceholder: "Name, code, mobile…",
    fields: [
      { type: "query", key: "active", label: "Status" },
      { type: "state", key: "dateRange", label: "Joined" },
      ...GEO_FIELDS,
    ],
  },
  "sales-team": {
    showSearch: true,
    searchPlaceholder: "Name, code, mobile…",
    fields: [
      { type: "query", key: "designation", label: "Designation" },
      { type: "query", key: "teamStatus", label: "Status" },
      { type: "query", key: "territory", label: "Territory" },
      { type: "state", key: "zone", label: "Zone" },
      { type: "state", key: "region", label: "Region" },
      { type: "state", key: "state", label: "State" },
    ],
  },
};

function buildQueryDimension(
  queryKey: QueryFilterKey,
  label: string,
): ViewFilterDimension {
  const def = QUERY_FILTER_DEFS[queryKey];
  return {
    key: queryKey as unknown as keyof FilterState,
    queryKey,
    label,
    type: "single-autocomplete",
    options: def.options,
    placeholder: label,
  };
}

export function getViewFilterDimensions(
  view: ListViewId,
  role: UserRole,
  filters: FilterState,
  geoOptions?: GeoDimensionOptions,
): ViewFilterDimension[] {
  const config = TABLE_FILTER_CONFIG[view];
  const stateDimMap = new Map(
    getVisibleDimensions(role, filters, geoOptions).map((dim) => [dim.key, dim]),
  );

  const result: ViewFilterDimension[] = [];

  for (const field of config.fields) {
    if (field.type === "state") {
      const dim = stateDimMap.get(field.key);
      if (!dim) continue;
      result.push({
        ...dim,
        label: field.label ?? dim.label,
        placeholder: field.label ?? dim.placeholder ?? dim.label,
      });
    } else {
      result.push(buildQueryDimension(field.key, field.label));
    }
  }

  return result;
}

export interface ViewActiveFilterChip {
  key: keyof FilterState | QueryFilterKey;
  value: string;
  label: string;
  dimensionLabel: string;
  source: "state" | "query";
}

function getOptionLabel(options: FilterOption[], value: string): string {
  return (
    options.find((o) => o.value === value)?.label ??
    getCachedOptionLabel(value) ??
    value
  );
}

export function buildViewActiveFilterChips(
  view: ListViewId,
  query: ListQueryParams,
  dimensions: ViewFilterDimension[],
): ViewActiveFilterChip[] {
  const chips: ViewActiveFilterChip[] = [];
  const config = TABLE_FILTER_CONFIG[view];
  const allowedStateKeys = new Set(
    config.fields.filter((f) => f.type === "state").map((f) => f.key),
  );
  const allowedQueryKeys = new Set(
    config.fields.filter((f) => f.type === "query").map((f) => f.key),
  );

  for (const dim of dimensions) {
    if (dim.queryKey) {
      if (!allowedQueryKeys.has(dim.queryKey)) continue;
      const val = query[dim.queryKey];
      if (val && val !== "") {
        chips.push({
          key: dim.queryKey,
          value: val,
          label: getOptionLabel(dim.options, val),
          dimensionLabel: dim.label,
          source: "query",
        });
      }
      continue;
    }

    if (!allowedStateKeys.has(dim.key)) continue;

    if (dim.type === "multi-autocomplete") {
      const values = query[dim.key as keyof FilterState];
      if (Array.isArray(values)) {
        for (const value of values) {
          chips.push({
            key: dim.key,
            value,
            label: getOptionLabel(dim.options, value),
            dimensionLabel: dim.label,
            source: "state",
          });
        }
      }
    } else if (dim.key === "dateRange" && query.dateRange && query.dateRange !== "all") {
      chips.push({
        key: "dateRange",
        value: query.dateRange,
        label: getOptionLabel(dim.options, query.dateRange),
        dimensionLabel: dim.label,
        source: "state",
      });
    } else if (dim.key === "premiumRange" && query.premiumRange) {
      chips.push({
        key: "premiumRange",
        value: query.premiumRange,
        label: getOptionLabel(dim.options, query.premiumRange),
        dimensionLabel: dim.label,
        source: "state",
      });
    }
  }

  if (query.dateRange === "custom") {
    const dateDim = dimensions.find((d) => d.key === "dateRange");
    const dateLabel = dateDim?.label ?? "Date";
    if (query.dateFrom) {
      chips.push({
        key: "dateFrom",
        value: query.dateFrom,
        label: query.dateFrom,
        dimensionLabel: `${dateLabel} From`,
        source: "state",
      });
    }
    if (query.dateTo) {
      chips.push({
        key: "dateTo",
        value: query.dateTo,
        label: query.dateTo,
        dimensionLabel: `${dateLabel} To`,
        source: "state",
      });
    }
  }

  return chips;
}

export function countActiveFiltersForView(
  view: ListViewId,
  query: ListQueryParams,
  role: UserRole,
): number {
  const dimensions = getViewFilterDimensions(view, role, query);
  return buildViewActiveFilterChips(view, query, dimensions).length;
}

export function getViewSearchPlaceholder(view: ListViewId): string {
  return TABLE_FILTER_CONFIG[view].searchPlaceholder ?? "Search…";
}

export function viewShowsSearch(view: ListViewId): boolean {
  return TABLE_FILTER_CONFIG[view].showSearch !== false;
}

/** Build query from draft, resetting only fields exposed in the current view. */
export function buildViewAppliedQuery(
  view: ListViewId,
  current: ListQueryParams,
  draftFilters: FilterState,
  draftQuery: Record<QueryFilterKey, string | undefined>,
): ListQueryParams {
  const config = TABLE_FILTER_CONFIG[view];
  const next: ListQueryParams = { ...current, page: 1 };

  for (const field of config.fields) {
    if (field.type === "state") {
      const key = field.key;
      if (isMultiFilterKey(key)) {
        next[key] = [];
      } else if (key === "dateRange") {
        next.dateRange = "all";
        next.dateFrom = "";
        next.dateTo = "";
      } else if (key === "premiumRange") {
        next.premiumRange = "";
      }
    } else {
      next[field.key] = undefined;
    }
  }

  for (const field of config.fields) {
    if (field.type === "state") {
      const key = field.key;
      if (isMultiFilterKey(key)) {
        next[key] = [...draftFilters[key]];
      } else if (key === "dateRange") {
        next.dateRange = draftFilters.dateRange || "all";
        next.dateFrom = draftFilters.dateFrom;
        next.dateTo = draftFilters.dateTo;
      } else if (key === "premiumRange") {
        next.premiumRange = draftFilters.premiumRange;
      }
    } else {
      const val = draftQuery[field.key];
      next[field.key] = val && val !== "" ? val : undefined;
    }
  }

  return next;
}

function pickViewFilterSlice(
  view: ListViewId,
  query: ListQueryParams,
): Partial<ListQueryParams> {
  const config = TABLE_FILTER_CONFIG[view];
  const slice: Partial<ListQueryParams> = {};

  for (const field of config.fields) {
    if (field.type === "state") {
      const key = field.key;
      if (isMultiFilterKey(key)) {
        slice[key] = [...query[key]];
      } else if (key === "dateRange") {
        slice.dateRange = query.dateRange;
        slice.dateFrom = query.dateFrom;
        slice.dateTo = query.dateTo;
      } else if (key === "premiumRange") {
        slice.premiumRange = query.premiumRange;
      }
    } else {
      const val = query[field.key];
      slice[field.key] = val && val !== "" ? val : undefined;
    }
  }

  return slice;
}

/** API params limited to filters relevant for the current view (avoids cross-page param leakage). */
export function buildViewApiParams(view: ListViewId, query: ListQueryParams): URLSearchParams {
  const viewSlice = pickViewFilterSlice(view, query);
  const payload: ListQueryParams = {
    ...EMPTY_FILTERS,
    ...viewSlice,
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
  };

  if (query.renewals) {
    payload.renewals = query.renewals;
    payload.policyStatus = query.policyStatus;
  }

  const params = listQueryToSearchParams(payload);

  if (payload.teamStatus) {
    params.set("status", payload.teamStatus);
    params.delete("teamStatus");
  }

  return params;
}
