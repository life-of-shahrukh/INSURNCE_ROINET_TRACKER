import { useQuery } from "@tanstack/react-query";
import { hierarchyApi, type HierarchyFilterOptions } from "@/lib/api/hierarchy-api";

const EMPTY: HierarchyFilterOptions = {
  zones: [],
  regions: [],
  areas: [],
  districts: [],
  subordinates: [],
  posps: [],
};

export function useHierarchyFilterOptions() {
  return useQuery({
    queryKey: ["hierarchy", "filter-options"],
    queryFn: () => hierarchyApi.getFilterOptions(),
    staleTime: 1000 * 60 * 5,
    placeholderData: EMPTY,
  });
}
