"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  countActiveFilters,
  DEFAULT_LIST_QUERY,
  listQueryToSearchParams,
  parseListQueryFromSearchParams,
  type ListQueryParams,
} from "@/lib/api/list-query-params";
import {
  applyCascadeClear,
  isMultiFilterKey,
  type FilterState,
} from "@/lib/filters/filter-utils";
import {
  buildViewApiParams,
  buildViewAppliedQuery,
  type ListViewId,
  type QueryFilterKey,
} from "@/lib/filters/table-filter-config";

export interface UseListQueryStateReturn {
  query: ListQueryParams;
  filters: FilterState;
  search: string;
  page: number;
  pageSize: number;
  activeCount: number;
  setFilter: (key: keyof FilterState, value: string | string[]) => void;
  applyFilters: (next: FilterState) => void;
  resetFilters: () => void;
  removeFilterChip: (
    key: keyof FilterState | QueryFilterKey,
    value: string,
    source: "state" | "query",
  ) => void;
  setSearch: (value: string) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setQuery: (patch: Partial<ListQueryParams>) => void;
  applyViewFilters: (
    draftFilters: FilterState,
    draftQuery: Record<QueryFilterKey, string | undefined>,
  ) => void;
  apiParams: URLSearchParams;
}

export function useListQueryState(
  defaults?: Partial<ListQueryParams>,
  view?: ListViewId,
): UseListQueryStateReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query = useMemo(
    () => parseListQueryFromSearchParams(searchParams, defaults),
    [searchParams, defaults],
  );

  const pushQuery = useCallback(
    (next: ListQueryParams) => {
      const qs = listQueryToSearchParams(next).toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  const setQuery = useCallback(
    (patch: Partial<ListQueryParams>) => {
      pushQuery({ ...query, ...patch, page: patch.page ?? 1 });
    },
    [pushQuery, query],
  );

  const setFilter = useCallback(
    (key: keyof FilterState, value: string | string[]) => {
      let next: ListQueryParams = { ...query, page: 1 };

      if (isMultiFilterKey(key)) {
        next = { ...next, [key]: value as string[] };
      } else {
        next = { ...next, [key]: value as string };
      }

      next = applyCascadeClear(key, next) as ListQueryParams;
      pushQuery(next);
    },
    [pushQuery, query],
  );

  const removeFilterChip = useCallback(
    (
      key: keyof FilterState | QueryFilterKey,
      value: string,
      source: "state" | "query",
    ) => {
      if (source === "query") {
        pushQuery({ ...query, [key]: undefined, page: 1 });
        return;
      }

      const stateKey = key as keyof FilterState;

      if (isMultiFilterKey(stateKey)) {
        const current = query[stateKey];
        setFilter(stateKey, current.filter((v) => v !== value));
        return;
      }
      if (stateKey === "dateRange") {
        pushQuery({ ...query, dateRange: "all", dateFrom: "", dateTo: "", page: 1 });
        return;
      }
      if (stateKey === "dateFrom" || stateKey === "dateTo") {
        pushQuery({ ...query, [stateKey]: "", page: 1 });
        return;
      }
      if (stateKey === "premiumRange") {
        pushQuery({ ...query, premiumRange: "", page: 1 });
      }
    },
    [pushQuery, query, setFilter],
  );

  const applyFilters = useCallback(
    (next: FilterState) => {
      pushQuery({ ...query, ...next, page: 1 });
    },
    [pushQuery, query],
  );

  const resetFilters = useCallback(() => {
    pushQuery({
      ...DEFAULT_LIST_QUERY,
      ...defaults,
      page: 1,
      search: "",
    });
  }, [pushQuery, defaults]);

  const setSearch = useCallback(
    (value: string) => setQuery({ search: value, page: 1 }),
    [setQuery],
  );

  const setPage = useCallback(
    (page: number) => setQuery({ page }),
    [setQuery],
  );

  const setPageSize = useCallback(
    (pageSize: number) => setQuery({ pageSize, page: 1 }),
    [setQuery],
  );

  const applyViewFilters = useCallback(
    (
      draftFilters: FilterState,
      draftQuery: Record<QueryFilterKey, string | undefined>,
    ) => {
      if (!view) return;
      pushQuery(buildViewAppliedQuery(view, query, draftFilters, draftQuery));
    },
    [pushQuery, query, view],
  );

  const apiParams = useMemo(() => {
    if (view) {
      return buildViewApiParams(view, query);
    }
    const params = listQueryToSearchParams(query);
    if (query.teamStatus) {
      params.set("status", query.teamStatus);
      params.delete("teamStatus");
    }
    return params;
  }, [query, view]);

  return {
    query,
    filters: query,
    search: query.search,
    page: query.page,
    pageSize: query.pageSize,
    activeCount: countActiveFilters(query),
    setFilter,
    applyFilters,
    resetFilters,
    removeFilterChip,
    setSearch,
    setPage,
    setPageSize,
    setQuery,
    applyViewFilters,
    apiParams,
  };
}
