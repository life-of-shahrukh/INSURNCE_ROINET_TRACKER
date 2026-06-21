import { useQuery } from "@tanstack/react-query";
import { hierarchyApi, type HierarchyFilterOptions } from "@/lib/api/hierarchy-api";

const EMPTY: HierarchyFilterOptions = {
  callerRole: "",
  nextLevel: null,
  subordinates: [],
  roleGroups: [],
  filterMode: { cascade: false, roleGroups: false, geo: false },
};

export function useHierarchyFilterOptions() {
  return useQuery({
    queryKey: ["hierarchy", "filter-options"],
    queryFn: () => hierarchyApi.getFilterOptions(),
    staleTime: 1000 * 60 * 5,
    placeholderData: EMPTY,
  });
}
