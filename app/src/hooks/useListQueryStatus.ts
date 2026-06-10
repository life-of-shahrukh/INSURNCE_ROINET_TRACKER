import type { UseQueryResult } from "@tanstack/react-query";
import type { PaginatedResponse } from "@/lib/api/pagination-types";

export interface ListQueryStatus {
  isInitialLoading: boolean;
  isRefreshing: boolean;
}

export function useListQueryStatus<T>(
  query: Pick<UseQueryResult<PaginatedResponse<T>>, "isLoading" | "isFetching" | "data">,
): ListQueryStatus {
  const hasData = query.data !== undefined;
  return {
    isInitialLoading: query.isLoading && !hasData,
    isRefreshing: query.isFetching && hasData,
  };
}
