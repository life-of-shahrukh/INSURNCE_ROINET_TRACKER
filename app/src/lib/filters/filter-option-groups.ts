import { getSubTypes, PRODUCT_LINE_OPTIONS } from "./insurance-products";
import type { FilterOption } from "./filter-utils";

export interface FilterOptionGroup {
  id: string;
  label: string;
  options: FilterOption[];
}

export function getProductSubTypeGroups(productLines: string[]): FilterOptionGroup[] {
  const lines =
    productLines.length > 0
      ? PRODUCT_LINE_OPTIONS.filter((p) => productLines.includes(p.value))
      : PRODUCT_LINE_OPTIONS;

  return lines
    .map((line) => ({
      id: line.value,
      label: line.label,
      options: getSubTypes(line.value).map((st) => ({
        value: st.value,
        label: st.label,
      })),
    }))
    .filter((group) => group.options.length > 0);
}
