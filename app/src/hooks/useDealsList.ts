import { useQuery } from "@tanstack/react-query";
import { crmApi } from "@/lib/api";
import { LIST_QUERY_OPTIONS } from "@/lib/query/list-query-options";

export const dealKeys = {
  all: ["deals"] as const,
  list: (params: string) => [...dealKeys.all, "list", params] as const,
};

export function useDealsList(apiParams: URLSearchParams) {
  const key = apiParams.toString();
  return useQuery({
    queryKey: dealKeys.list(key),
    queryFn: () => crmApi.listDeals(apiParams),
    staleTime: 1000 * 60,
    ...LIST_QUERY_OPTIONS,
  });
}
