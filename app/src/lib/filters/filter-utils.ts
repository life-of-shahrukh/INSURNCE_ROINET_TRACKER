import type { UserRole } from "@/lib/auth-types";
import type { Deal } from "@/lib/types";
import { PRODUCT_LINE_OPTIONS, getSubTypes, INSURER_OPTIONS } from "./insurance-products";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDimension {
  key: keyof FilterState;
  label: string;
  type: "select" | "date-range" | "multi-select";
  options: FilterOption[];
  /** Minimum role required to see this filter */
  minRole?: UserRole;
  /** Exact roles that can see this filter (if minRole not sufficient) */
  visibleToRoles?: UserRole[];
  placeholder?: string;
}

export interface FilterState {
  dateRange: string;
  dateFrom: string;
  dateTo: string;
  zone: string;
  region: string;
  area: string;
  district: string;
  posp: string;
  productLine: string;
  productSubType: string;
  insurer: string;
  dealStatus: string;
  premiumRange: string;
  policyStatus: string;
  kycStatus: string;
  source: string;
}

export const EMPTY_FILTERS: FilterState = {
  dateRange: "all",
  dateFrom: "",
  dateTo: "",
  zone: "",
  region: "",
  area: "",
  district: "",
  posp: "",
  productLine: "",
  productSubType: "",
  insurer: "",
  dealStatus: "",
  premiumRange: "",
  policyStatus: "",
  kycStatus: "",
  source: "",
};

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

/**
 * Returns the filter dimensions visible to the given role.
 * Cascading geographical dimensions unlock as the role rank increases.
 * productSubType options cascade from productLine selection.
 */
export function getVisibleDimensions(
  role: UserRole,
  currentFilters: FilterState,
): FilterDimension[] {
  const all: FilterDimension[] = [
    // ── Temporal ────────────────────────────────────────────────────────────
    {
      key: "dateRange",
      label: "Date Range",
      type: "select",
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

    // ── Geographical hierarchy (unlocks upward) ──────────────────────────────
    {
      key: "zone",
      label: "Zone",
      type: "select",
      options: [], // populated from API
      minRole: undefined,
      visibleToRoles: ["SUPER_ADMIN", "NATIONAL_HEAD"],
      placeholder: "All Zones",
    },
    {
      key: "region",
      label: "Region",
      type: "select",
      options: [],
      visibleToRoles: ["SUPER_ADMIN", "NATIONAL_HEAD", "ZH"],
      placeholder: "All Regions",
    },
    {
      key: "area",
      label: "Area",
      type: "select",
      options: [],
      visibleToRoles: ["SUPER_ADMIN", "NATIONAL_HEAD", "ZH", "RH"],
      placeholder: "All Areas",
    },
    {
      key: "district",
      label: "District",
      type: "select",
      options: [],
      visibleToRoles: ["SUPER_ADMIN", "NATIONAL_HEAD", "ZH", "RH", "ASM"],
      placeholder: "All Districts",
    },

    // ── Sales hierarchy ───────────────────────────────────────────────────────
    {
      key: "posp",
      label: "POSP",
      type: "select",
      options: [],
      visibleToRoles: ["SUPER_ADMIN", "NATIONAL_HEAD", "ZH", "RH", "ASM", "DM"],
      placeholder: "All POSPs",
    },

    // ── Product classification ────────────────────────────────────────────────
    {
      key: "productLine",
      label: "Product Line",
      type: "select",
      options: [{ value: "", label: "All Products" }, ...PRODUCT_LINE_OPTIONS],
      placeholder: "All Products",
    },
    {
      key: "productSubType",
      label: "Sub-Type",
      type: "select",
      options:
        currentFilters.productLine
          ? [
              { value: "", label: "All Sub-Types" },
              ...getSubTypes(currentFilters.productLine),
            ]
          : [{ value: "", label: "Select product first" }],
      placeholder: "Sub-Type",
    },
    {
      key: "insurer",
      label: "Insurer",
      type: "select",
      options: [{ value: "", label: "All Insurers" }, ...INSURER_OPTIONS],
      minRole: "ASM",
      placeholder: "All Insurers",
    },

    // ── Deal metrics ──────────────────────────────────────────────────────────
    {
      key: "dealStatus",
      label: "Deal Status",
      type: "select",
      options: [
        { value: "", label: "All Statuses" },
        { value: "H", label: "Hot" },
        { value: "W", label: "Warm" },
        { value: "C", label: "Cold" },
      ],
      placeholder: "All Statuses",
    },
    {
      key: "policyStatus",
      label: "Policy Status",
      type: "select",
      options: [
        { value: "", label: "All" },
        { value: "issued", label: "Issued" },
        { value: "pending", label: "Pending" },
      ],
      placeholder: "Policy Status",
    },
    {
      key: "premiumRange",
      label: "Premium Range",
      type: "select",
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

    // ── Customer segments ─────────────────────────────────────────────────────
    {
      key: "kycStatus",
      label: "KYC Status",
      type: "select",
      options: [
        { value: "", label: "All KYC" },
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
      type: "select",
      options: [
        { value: "", label: "All Sources" },
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
    if (dim.visibleToRoles) {
      return dim.visibleToRoles.includes(role);
    }
    if (dim.minRole) {
      return hasMinRole(role, dim.minRole);
    }
    return true; // no restriction
  });
}

/**
 * Parses a premium range string like "10000-25000" or "500000+"
 * into a [min, max] tuple. max = Infinity if open-ended.
 */
function parsePremiumRange(range: string): [number, number] {
  if (!range) return [0, Infinity];
  if (range.endsWith("+")) return [Number(range.slice(0, -1)), Infinity];
  const [min, max] = range.split("-").map(Number);
  return [min, max];
}

/**
 * Applies frontend-side filter state to a list of deals.
 * This is used for client-side filtering after the server has already
 * scoped data by role. Server-side scope wins — this is additive refinement.
 */
export function applyFiltersToDeals(deals: Deal[], filters: FilterState): Deal[] {
  let result = deals;

  // Deal status
  if (filters.dealStatus) {
    result = result.filter((d) => d.status === filters.dealStatus);
  }

  // Policy issuance
  if (filters.policyStatus === "issued") {
    result = result.filter((d) => !!d.issued);
  } else if (filters.policyStatus === "pending") {
    result = result.filter((d) => !d.issued);
  }

  // Premium range
  if (filters.premiumRange) {
    const [min, max] = parsePremiumRange(filters.premiumRange);
    result = result.filter((d) => d.premium >= min && d.premium <= max);
  }

  // Date range on expected close date
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

    if (from) result = result.filter((d) => new Date(d.expected) >= from!);
    if (to) result = result.filter((d) => new Date(d.expected) <= to!);
  }

  return result;
}

/** Build URL query params from FilterState for server-assisted filtering (future use) */
export function filterStateToParams(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, val] of Object.entries(filters)) {
    if (val && val !== "all") params.set(key, val as string);
  }
  return params;
}
