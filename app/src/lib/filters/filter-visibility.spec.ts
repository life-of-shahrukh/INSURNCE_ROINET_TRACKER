import type { UserRole } from "@/lib/auth-types";
import {
  firstGeoFilterForRole,
  isGeoFilterVisible,
  isManagerRoleGroupVisible,
} from "./filter-visibility";

describe("firstGeoFilterForRole", () => {
  it.each<[UserRole, string | null]>([
    ["SUPER_ADMIN", "zone"],
    ["NATIONAL_HEAD", "zone"],
    ["ZH", "region"],
    ["RH", "state"],
    ["ASM", "district"],
    ["DM", "district"],
    ["POSP", null],
  ])("%s starts at %s", (role, expected) => {
    expect(firstGeoFilterForRole(role)).toBe(expected);
  });
});

describe("isGeoFilterVisible", () => {
  it("SUPER_ADMIN sees full geo chain including posp", () => {
    expect(isGeoFilterVisible("SUPER_ADMIN", "zone")).toBe(true);
    expect(isGeoFilterVisible("SUPER_ADMIN", "region")).toBe(true);
    expect(isGeoFilterVisible("SUPER_ADMIN", "posp")).toBe(true);
  });

  it("ZH hides zone but sees region and below", () => {
    expect(isGeoFilterVisible("ZH", "zone")).toBe(false);
    expect(isGeoFilterVisible("ZH", "region")).toBe(true);
    expect(isGeoFilterVisible("ZH", "posp")).toBe(true);
  });

  it("RH sees state, district, city, posp only", () => {
    expect(isGeoFilterVisible("RH", "zone")).toBe(false);
    expect(isGeoFilterVisible("RH", "region")).toBe(false);
    expect(isGeoFilterVisible("RH", "state")).toBe(true);
    expect(isGeoFilterVisible("RH", "district")).toBe(true);
    expect(isGeoFilterVisible("RH", "posp")).toBe(true);
  });

  it("DM sees district, city, posp only", () => {
    expect(isGeoFilterVisible("DM", "state")).toBe(false);
    expect(isGeoFilterVisible("DM", "district")).toBe(true);
    expect(isGeoFilterVisible("DM", "city")).toBe(true);
    expect(isGeoFilterVisible("DM", "posp")).toBe(true);
  });

  it("POSP sees no geo filters", () => {
    expect(isGeoFilterVisible("POSP", "district")).toBe(false);
    expect(isGeoFilterVisible("POSP", "posp")).toBe(false);
  });
});

describe("isManagerRoleGroupVisible", () => {
  it("RH sees ASM groups but not ZH", () => {
    expect(isManagerRoleGroupVisible("RH", "ASM")).toBe(true);
    expect(isManagerRoleGroupVisible("RH", "ZH")).toBe(false);
    expect(isManagerRoleGroupVisible("RH", "SZH")).toBe(false);
  });

  it("DM sees no manager role groups at same or higher rank", () => {
    expect(isManagerRoleGroupVisible("DM", "ASM")).toBe(false);
    expect(isManagerRoleGroupVisible("DM", "CSP")).toBe(false);
  });
});
