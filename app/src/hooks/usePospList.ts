import { useQuery } from "@tanstack/react-query";
import { crmApi } from "@/lib/api";
import { LIST_QUERY_OPTIONS } from "@/lib/query/list-query-options";

export const pospKeys = {
  all: ["posp"] as const,
  list: (params: string) => [...pospKeys.all, "list", params] as const,
};

export function usePospList(apiParams: URLSearchParams) {
  const key = apiParams.toString();
  return useQuery({
    queryKey: pospKeys.list(key),
    queryFn: () => crmApi.listPosp(apiParams),
    staleTime: 1000 * 60,
    ...LIST_QUERY_OPTIONS,
  });
}
