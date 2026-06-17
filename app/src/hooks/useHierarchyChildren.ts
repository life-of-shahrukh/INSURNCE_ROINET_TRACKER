import { useQuery } from "@tanstack/react-query";
import {
  hierarchyApi,
  type SubordinatesResult,
} from "@/lib/api/hierarchy-api";

const EMPTY: SubordinatesResult = { nextLevel: null, members: [], posps: [] };

/**
 * Fetches the next level down under a selected manager (by level + code).
 * Disabled until both `level` and `code` are present.
 */
export function useHierarchyChildren(
  level: string | undefined,
  code: string | undefined,
) {
  return useQuery({
    queryKey: ["hierarchy", "children", level, code],
    queryFn: () => hierarchyApi.getSubordinates(level!, code!),
    enabled: !!level && !!code,
    staleTime: 1000 * 60 * 2,
    placeholderData: EMPTY,
  });
}
