/**
 * Unit tests for frontend filter utilities.
 * Tests getVisibleDimensions and applyFiltersToDeals for all 7 roles.
 */

import {
  getVisibleDimensions,
  applyFiltersToDeals,
  buildActiveFilterChips,
  countFilterSelections,
  filterStateToParams,
  parseMultiFromParams,
  EMPTY_FILTERS,
  type FilterState,
} from "../../lib/filters/filter-utils";
import { getProductSubTypeGroups } from "../../lib/filters/filter-option-groups";
import type { UserRole } from "../../lib/auth-types";
import type { Deal } from "../../lib/types";

function makeDeal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: "deal-1",
    pospId: "posp-1",
    customerId: null,
    customer: "Test Customer",
    policy: "Term Life",
    sum: 500000,
    premium: 12000,
    coa: 1200,
    coaType: "AMOUNT",
    coaAmount: 1200,
    margin: 600,
    status: "H",
    expected: new Date("2026-07-01"),
    proposal: "P-001",
    policyNo: "POL-001",
    issued: undefined,
    remarks: "",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("getVisibleDimensions", () => {
  const allRoles: UserRole[] = [
    "SUPER_ADMIN", "NATIONAL_HEAD", "ZH", "RH", "ASM", "DM", "POSP",
  ];

  it.each(allRoles)("%s gets at least dateRange and dealStatus dimensions", (role: UserRole) => {
    const dims = getVisibleDimensions(role, EMPTY_FILTERS);
    const keys = dims.map((d) => d.key);
    expect(keys).toContain("dateRange");
    expect(keys).toContain("dealStatus");
    expect(keys).toContain("productLine");
  });

  it("SUPER_ADMIN sees zone, region, state, district, posp dimensions", () => {
    const dims = getVisibleDimensions("SUPER_ADMIN", EMPTY_FILTERS);
    const keys = dims.map((d) => d.key);
    expect(keys).toContain("zone");
    expect(keys).toContain("region");
    expect(keys).toContain("state");
    expect(keys).toContain("district");
    expect(keys).toContain("posp");
    expect(keys).not.toContain("area");
  });

  it("RH sees state through posp but not zone or region", () => {
    const keys = getVisibleDimensions("RH", EMPTY_FILTERS).map((d) => d.key);
    expect(keys).toContain("state");
    expect(keys).toContain("district");
    expect(keys).toContain("posp");
    expect(keys).not.toContain("zone");
    expect(keys).not.toContain("region");
  });

  it("DM sees district, city, and posp", () => {
    const keys = getVisibleDimensions("DM", EMPTY_FILTERS).map((d) => d.key);
    expect(keys).toContain("district");
    expect(keys).toContain("city");
    expect(keys).toContain("posp");
    expect(keys).not.toContain("state");
  });

  it("productSubType options are populated when productLine is selected", () => {
    const filters: FilterState = { ...EMPTY_FILTERS, productLine: ["HEALTH"] };
    const dims = getVisibleDimensions("POSP", filters);
    const subType = dims.find((d) => d.key === "productSubType");
    expect(subType).toBeDefined();
    expect(subType?.options.length).toBeGreaterThan(1);
    expect(subType?.options.some((o) => o.value === "FAMILY_FLOATER")).toBe(true);
  });
});

describe("getProductSubTypeGroups", () => {
  it("returns all product line groups when no lines are selected", () => {
    const groups = getProductSubTypeGroups([]);
    expect(groups.length).toBeGreaterThan(1);
    expect(groups.some((g) => g.id === "HEALTH")).toBe(true);
  });

  it("returns only selected product line groups", () => {
    const groups = getProductSubTypeGroups(["HEALTH"]);
    expect(groups).toHaveLength(1);
    expect(groups[0].id).toBe("HEALTH");
    expect(groups[0].options.some((o) => o.value === "FAMILY_FLOATER")).toBe(true);
  });
});

describe("multi-value filter helpers", () => {
  it("filterStateToParams emits repeated keys for multi fields", () => {
    const params = filterStateToParams({
      ...EMPTY_FILTERS,
      dealStatus: ["H", "W"],
    });
    expect(params.getAll("dealStatus")).toEqual(["H", "W"]);
  });

  it("parseMultiFromParams reads repeated URL keys", () => {
    const params = new URLSearchParams("dealStatus=H&dealStatus=W");
    expect(parseMultiFromParams(params, "dealStatus")).toEqual(["H", "W"]);
  });

  it("buildActiveFilterChips creates one chip per selected value", () => {
    const dims = getVisibleDimensions("POSP", EMPTY_FILTERS);
    const chips = buildActiveFilterChips(
      { ...EMPTY_FILTERS, dealStatus: ["H", "W"] },
      dims,
    );
    expect(chips).toHaveLength(2);
    expect(chips.map((c) => c.value)).toEqual(["H", "W"]);
  });

  it("countFilterSelections counts each multi value separately", () => {
    expect(
      countFilterSelections({ ...EMPTY_FILTERS, dealStatus: ["H", "W"] }),
    ).toBe(2);
  });
});

describe("applyFiltersToDeals", () => {
  const deals: Deal[] = [
    makeDeal({ id: "d1", status: "H", premium: 5000, issued: undefined }),
    makeDeal({ id: "d2", status: "W", premium: 15000, issued: new Date("2026-05-01") }),
    makeDeal({ id: "d3", status: "C", premium: 60000, issued: undefined }),
    makeDeal({ id: "d4", status: "H", premium: 120000, issued: new Date("2026-06-01") }),
  ];

  it("empty filters returns all deals", () => {
    const result = applyFiltersToDeals(deals, EMPTY_FILTERS);
    expect(result).toHaveLength(4);
  });

  it("dealStatus H returns only hot deals", () => {
    const result = applyFiltersToDeals(deals, { ...EMPTY_FILTERS, dealStatus: ["H"] });
    expect(result).toHaveLength(2);
    expect(result.every((d) => d.status === "H")).toBe(true);
  });

  it("multiple dealStatus values return union of matches", () => {
    const result = applyFiltersToDeals(deals, { ...EMPTY_FILTERS, dealStatus: ["H", "W"] });
    expect(result).toHaveLength(3);
  });

  it("policyStatus issued returns only issued deals", () => {
    const result = applyFiltersToDeals(deals, { ...EMPTY_FILTERS, policyStatus: ["issued"] });
    expect(result).toHaveLength(2);
    expect(result.every((d) => !!d.issued)).toBe(true);
  });

  it("policyStatus pending returns only unissued deals", () => {
    const result = applyFiltersToDeals(deals, { ...EMPTY_FILTERS, policyStatus: ["pending"] });
    expect(result).toHaveLength(2);
    expect(result.every((d) => !d.issued)).toBe(true);
  });

  it("both policyStatus values match all deals", () => {
    const result = applyFiltersToDeals(deals, {
      ...EMPTY_FILTERS,
      policyStatus: ["issued", "pending"],
    });
    expect(result).toHaveLength(4);
  });

  it("premium range 10000-25000 filters correctly", () => {
    const result = applyFiltersToDeals(deals, {
      ...EMPTY_FILTERS,
      premiumRange: "10000-25000",
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("d2");
  });

  it("combined filters are AND-ed", () => {
    const result = applyFiltersToDeals(deals, {
      ...EMPTY_FILTERS,
      dealStatus: ["H"],
      policyStatus: ["issued"],
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("d4");
  });
});
