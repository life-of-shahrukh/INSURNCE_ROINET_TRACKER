import { useQuery } from "@tanstack/react-query";
import {
  dashboardApi,
  EMPTY_STATS,
  type DashboardStats,
} from "@/lib/api/dashboard-api";

export type { DashboardStats };

export const dashboardStatKeys = {
  all: ["dashboard"] as const,
  stats: (params: string) =>
    [...dashboardStatKeys.all, "stats", params] as const,
};

export function useDashboardStats(params: URLSearchParams) {
  return useQuery({
    queryKey: dashboardStatKeys.stats(params.toString()),
    queryFn: () => dashboardApi.getStats(params),
    staleTime: 1000 * 60,
    placeholderData: EMPTY_STATS,
  });
}
