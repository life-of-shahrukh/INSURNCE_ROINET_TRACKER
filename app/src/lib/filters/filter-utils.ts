import type { UserRole } from "@/lib/auth-types";
import type { ListQueryParams } from "@/lib/api/list-query-params";
import type { Deal } from "@/lib/types";
import { PRODUCT_LINE_OPTIONS, getSubTypes, INSURER_OPTIONS } from "./insurance-products";
import { getCachedOptionLabel } from "./option-label-cache";
import {
  GEO_FILTER_ORDER,
  isGeoFilterVisible,
  type GeoFilterKey,
} from "./filter-visibility";

export interface FilterOption {
  value: string;
  label: string;
}

export type MultiFilterKey =
  | "zone"
  | "region"
  | "state"
  | "area"
  | "district"
  | "city"
  | "posp"
  | "productLine"
  | "productSubType"
  | "insurer"
  | "dealStatus"
  | "policyStatus"
  | "kycStatus"
  | "source";

export type SingleFilterKey = "dateRange" | "dateFrom" | "dateTo" | "premiumRange";

export const MULTI_FILTER_KEYS: MultiFilterKey[] = [
  "zone",
  "region",
  "state",
  "area",
  "district",
  "city",
  "posp",
  "productLine",
  "productSubType",
  "insurer",
  "dealStatus",
  "policyStatus",
  "kycStatus",
  "source",
];

export function isMultiFilterKey(key: keyof FilterState): key is MultiFilterKey {
  return (MULTI_FILTER_KEYS as string[]).includes(key);
}

export interface FilterDimension {
  key: keyof FilterState;
  label: string;
  type: "single-autocomplete" | "multi-autocomplete" | "date-range" | "date";
  options: FilterOption[];
  minRole?: UserRole;
  visibleToRoles?: UserRole[];
  placeholder?: string;
}

export interface FilterState {
  dateRange: string;
  dateFrom: string;
  dateTo: string;
  premiumRange: string;
  zone: string[];
  region: string[];
  state: string[];
  area: string[];
  district: string[];
  city: string[];
  posp: string[];
  productLine: string[];
  productSubType: string[];
  insurer: string[];
  dealStatus: string[];
  policyStatus: string[];
  kycStatus: string[];
  source: string[];
}

export const EMPTY_FILTERS: FilterState = {
  dateRange: "all",
  dateFrom: "",
  dateTo: "",
  premiumRange: "",
  zone: [],
  region: [],
  state: [],
  area: [],
  district: [],
  city: [],
  posp: [],
  productLine: [],
  productSubType: [],
  insurer: [],
  dealStatus: [],
  policyStatus: [],
  kycStatus: [],
  source: [],
};

export interface ActiveFilterChip {
  key: keyof FilterState;
  value: string;
  label: string;
  dimensionLabel: string;
}

const ROLE_RANK: Record<UserRole, number> = {
  SUPER_ADMIN: 100,
  NATIONAL_HEAD: 80,
  ZH: 60,
  RH: 40,
  ASM: 20,
  DM: 10,
  POSP: 5,
};

function hasMinRole(userRole: UserRole, minRole: UserRole): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[minRole];
}

function selectableOptions(options: FilterOption[]): FilterOption[] {
  return options.filter((o) => o.value !== "");
}

function subTypeOptions(productLines: string[]): FilterOption[] {
  if (productLines.length === 0) {
    return [{ value: "", label: "Select product first" }];
  }
  const seen = new Set<string>();
  const merged: FilterOption[] = [];
  for (const line of productLines) {
    for (const opt of getSubTypes(line)) {
      if (!seen.has(opt.value)) {
        seen.add(opt.value);
        merged.push(opt);
      }
    }
  }
  return merged;
}

/** Small geo reference lists fed into zone/region/state dropdowns. */
export interface GeoDimensionOptions {
  zones: FilterOption[];
  regions: FilterOption[];
  states: FilterOption[];
}

const EMPTY_GEO_DIMENSION_OPTIONS: GeoDimensionOptions = {
  zones: [],
  regions: [],
  states: [],
};

export function getVisibleDimensions(
  role: UserRole,
  currentFilters: FilterState,
  geoOptions: GeoDimensionOptions = EMPTY_GEO_DIMENSION_OPTIONS,
): FilterDimension[] {
  const all: FilterDimension[] = [
    {
      key: "dateRange",
      label: "Date Range",
      type: "single-autocomplete",
      options: [
        { value: "all", label: "All Time" },
        { value: "today", label: "Today" },
        { value: "week", label: "This Week" },
        { value: "month", label: "This Month" },
        { value: "quarter", label: "This Quarter" },
        { value: "year", label: "This Year" },
        { value: "custom", label: "Custom Range" },
      ],
      placeholder: "Date Range",
    },
    {
      key: "zone",
      label: "Zone",
      type: "multi-autocomplete",
      options: geoOptions.zones,
      placeholder: "All Zones",
    },
    {
      key: "region",
      label: "Region",
      type: "multi-autocomplete",
      options: geoOptions.regions,
      placeholder: "All Regions",
    },
    {
      key: "state",
      label: "State",
      type: "multi-autocomplete",
      options: geoOptions.states,
      placeholder: "All States",
    },
    {
      key: "district",
      label: "District",
      type: "multi-autocomplete",
      options: [],
      placeholder: "All Districts",
    },
    {
      key: "city",
      label: "City",
      type: "multi-autocomplete",
      options: [],
      placeholder: "All Cities",
    },
    {
      key: "posp",
      label: "POSP",
      type: "multi-autocomplete",
      options: [],
      placeholder: "All POSPs",
    },
    {
      key: "productLine",
      label: "Product Line",
      type: "multi-autocomplete",
      options: PRODUCT_LINE_OPTIONS,
      placeholder: "All Products",
    },
    {
      key: "productSubType",
      label: "Sub-Type",
      type: "multi-autocomplete",
      options: subTypeOptions(currentFilters.productLine),
      placeholder: "Sub-Type",
    },
    {
      key: "insurer",
      label: "Insurer",
      type: "multi-autocomplete",
      options: INSURER_OPTIONS,
      minRole: "ASM",
      placeholder: "All Insurers",
    },
    {
      key: "dealStatus",
      label: "Deal Status",
      type: "multi-autocomplete",
      options: [
        { value: "H", label: "Hot" },
        { value: "W", label: "Warm" },
        { value: "C", label: "Cold" },
        { value: "D", label: "Done" },
      ],
      placeholder: "All Statuses",
    },
    {
      key: "policyStatus",
      label: "Policy Status",
      type: "multi-autocomplete",
      options: [
        { value: "issued", label: "Issued" },
        { value: "pending", label: "Pending" },
      ],
      placeholder: "Policy Status",
    },
    {
      key: "premiumRange",
      label: "Premium Range",
      type: "single-autocomplete",
      options: [
        { value: "", label: "Any Premium" },
        { value: "0-10000", label: "₹0 – ₹10K" },
        { value: "10000-25000", label: "₹10K – ₹25K" },
        { value: "25000-50000", label: "₹25K – ₹50K" },
        { value: "50000-100000", label: "₹50K – ₹1L" },
        { value: "100000-500000", label: "₹1L – ₹5L" },
        { value: "500000+", label: "₹5L+" },
      ],
      placeholder: "Any Premium",
    },
    {
      key: "kycStatus",
      label: "KYC Status",
      type: "multi-autocomplete",
      options: [
        { value: "PENDING", label: "Pending" },
        { value: "VERIFIED", label: "Verified" },
        { value: "REJECTED", label: "Rejected" },
      ],
      minRole: "ASM",
      placeholder: "All KYC",
    },
    {
      key: "source",
      label: "Lead Source",
      type: "multi-autocomplete",
      options: [
        { value: "WALK_IN", label: "Walk-In" },
        { value: "REFERRAL", label: "Referral" },
        { value: "ONLINE", label: "Online" },
        { value: "TELE_SALES", label: "Tele-Sales" },
        { value: "CAMP", label: "Camp / Event" },
        { value: "RENEWAL", label: "Renewal" },
      ],
      placeholder: "All Sources",
    },
  ];

  return all.filter((dim) => {
    if ((GEO_FILTER_ORDER as readonly string[]).includes(dim.key)) {
      return isGeoFilterVisible(role, dim.key as GeoFilterKey);
    }
    if (dim.minRole) return hasMinRole(role, dim.minRole);
    return true;
  });
}

export function getOptionLabel(dim: FilterDimension, value: string): string {
  return (
    dim.options.find((o) => o.value === value)?.label ??
    getCachedOptionLabel(value) ??
    value
  );
}

export function buildActiveFilterChips(
  filters: FilterState,
  dimensions: FilterDimension[],
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  for (const dim of dimensions) {
    if (isMultiFilterKey(dim.key)) {
      for (const value of filters[dim.key]) {
        chips.push({
          key: dim.key,
          value,
          label: getOptionLabel(dim, value),
          dimensionLabel: dim.label,
        });
      }
    } else if (dim.key === "dateRange" && filters.dateRange && filters.dateRange !== "all") {
      chips.push({
        key: "dateRange",
        value: filters.dateRange,
        label: getOptionLabel(dim, filters.dateRange),
        dimensionLabel: dim.label,
      });
    } else if (dim.key === "premiumRange" && filters.premiumRange) {
      chips.push({
        key: "premiumRange",
        value: filters.premiumRange,
        label: getOptionLabel(dim, filters.premiumRange),
        dimensionLabel: dim.label,
      });
    }
  }

  if (filters.dateRange === "custom") {
    if (filters.dateFrom) {
      chips.push({
        key: "dateFrom",
        value: filters.dateFrom,
        label: filters.dateFrom,
        dimensionLabel: "From",
      });
    }
    if (filters.dateTo) {
      chips.push({
        key: "dateTo",
        value: filters.dateTo,
        label: filters.dateTo,
        dimensionLabel: "To",
      });
    }
  }

  return chips;
}

export function countFilterSelections(filters: FilterState): number {
  let count = 0;
  for (const key of MULTI_FILTER_KEYS) {
    count += filters[key].length;
  }
  if (filters.dateRange && filters.dateRange !== "all") count++;
  if (filters.premiumRange) count++;
  if (filters.dateRange === "custom") {
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
  }
  return count;
}

export function applyCascadeClear(
  key: keyof FilterState,
  next: FilterState,
): FilterState {
  if (key === "productLine") return { ...next, productSubType: [] };
  if (key === "zone")
    return { ...next, region: [], state: [], area: [], district: [], city: [], posp: [] };
  if (key === "region")
    return { ...next, state: [], area: [], district: [], city: [], posp: [] };
  if (key === "state") return { ...next, area: [], district: [], city: [], posp: [] };
  if (key === "area") return { ...next, district: [], city: [], posp: [] };
  if (key === "district") return { ...next, city: [], posp: [] };
  if (key === "city") return { ...next, posp: [] };
  return next;
}

function parsePremiumRange(range: string): [number, number] {
  if (!range) return [0, Infinity];
  if (range.endsWith("+")) return [Number(range.slice(0, -1)), Infinity];
  const [min, max] = range.split("-").map(Number);
  return [min, max];
}

export function applyFiltersToDeals(
  deals: Deal[],
  filters: FilterState,
  options?: { dateField?: "expected" | "issued" },
): Deal[] {
  const dateField = options?.dateField ?? "expected";
  let result = deals;

  if (filters.dealStatus.length > 0) {
    result = result.filter((d) => filters.dealStatus.includes(d.status));
  }

  if (filters.policyStatus.length > 0) {
    const hasIssued = filters.policyStatus.includes("issued");
    const hasPending = filters.policyStatus.includes("pending");
    if (hasIssued && !hasPending) {
      result = result.filter((d) => !!d.issued);
    } else if (hasPending && !hasIssued) {
      result = result.filter((d) => !d.issued);
    }
  }
  if (filters.premiumRange) {
    const [min, max] = parsePremiumRange(filters.premiumRange);
    result = result.filter((d) => d.premium >= min && d.premium <= max);
  }

  if (filters.dateRange && filters.dateRange !== "all") {
    const now = new Date();
    let from: Date | null = null;
    let to: Date | null = null;

    switch (filters.dateRange) {
      case "today":
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case "week": {
        const day = now.getDay();
        from = new Date(now);
        from.setDate(now.getDate() - day);
        to = new Date(from);
        to.setDate(from.getDate() + 6);
        break;
      }
      case "month":
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case "quarter": {
        const q = Math.floor(now.getMonth() / 3);
        from = new Date(now.getFullYear(), q * 3, 1);
        to = new Date(now.getFullYear(), q * 3 + 3, 0);
        break;
      }
      case "year":
        from = new Date(now.getFullYear(), 0, 1);
        to = new Date(now.getFullYear(), 11, 31);
        break;
      case "custom":
        from = filters.dateFrom ? new Date(filters.dateFrom) : null;
        to = filters.dateTo ? new Date(filters.dateTo) : null;
        break;
    }

    if (from) {
      result = result.filter((d) => {
        const raw = dateField === "issued" ? d.issued : d.expected;
        if (!raw) return false;
        return new Date(raw) >= from;
      });
    }
    if (to) {
      result = result.filter((d) => {
        const raw = dateField === "issued" ? d.issued : d.expected;
        if (!raw) return false;
        return new Date(raw) <= to;
      });
    }
  }

  return result;
}

export function filterDealsForListQuery(deals: Deal[], query: ListQueryParams): Deal[] {
  const dateField = query.renewals === "true" ? "issued" : "expected";
  let result = applyFiltersToDeals(deals, query, { dateField });

  if (query.posp.length > 0) {
    result = result.filter((d) => d.pospId !== null && query.posp.includes(d.pospId));
  }

  if (query.renewals === "true") {
    result = result.filter((d) => !!d.issued);
  }

  return result;
}

export function filterStateToParams(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.dateRange && filters.dateRange !== "all") {
    params.set("dateRange", filters.dateRange);
  }
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.premiumRange) params.set("premiumRange", filters.premiumRange);

  for (const key of MULTI_FILTER_KEYS) {
    for (const value of filters[key]) {
      params.append(key, value);
    }
  }

  return params;
}

export function parseMultiFromParams(
  params: URLSearchParams,
  key: string,
): string[] {
  const all = params.getAll(key);
  if (all.length === 0) {
    const single = params.get(key);
    if (!single) return [];
    return single.split(",").map((v) => v.trim()).filter(Boolean);
  }
  return all.flatMap((v) => v.split(",")).map((v) => v.trim()).filter(Boolean);
}

export { selectableOptions };
