import { useQuery } from "@tanstack/react-query";
import {
  hierarchyApi,
  type SubordinatesResult,
} from "@/lib/api/hierarchy-api";

const EMPTY: SubordinatesResult = { members: [], posps: [] };

export function useHierarchyChildren(salesTeamId: string | undefined) {
  return useQuery({
    queryKey: ["hierarchy", "children", salesTeamId],
    queryFn: () => hierarchyApi.getSubordinates(salesTeamId!),
    enabled: !!salesTeamId,
    staleTime: 1000 * 60 * 2,
    placeholderData: EMPTY,
  });
}
