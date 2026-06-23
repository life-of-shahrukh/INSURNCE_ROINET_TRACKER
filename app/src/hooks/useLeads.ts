import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadApi, CreateLeadInput, UpdateLeadInput, type Lead } from '../lib/api/lead-api';
import type { PaginatedResponse } from '../lib/api/pagination-types';
import { LIST_QUERY_OPTIONS } from '@/lib/query/list-query-options';
import { dealKeys } from '@/hooks/useDealsList';
import { dashboardStatKeys } from '@/hooks/useDashboardStats';

export const leadKeys = {
  all: ['leads'] as const,
  list: (params: string) => [...leadKeys.all, 'list', params] as const,
  commitment: () => [...leadKeys.all, 'commitment'] as const,
};

function patchLeadInLists(
  old: PaginatedResponse<Lead> | undefined,
  updated: Lead,
): PaginatedResponse<Lead> | undefined {
  if (!old?.data) return old;
  const idx = old.data.findIndex((l) => l.id === updated.id);
  if (idx < 0) return old;
  const data = [...old.data];
  data[idx] = updated;
  return { ...old, data };
}

function upsertLeadInLists(
  old: PaginatedResponse<Lead> | undefined,
  created: Lead,
): PaginatedResponse<Lead> | undefined {
  if (!old?.data) return old;
  if (old.data.some((l) => l.id === created.id)) {
    return patchLeadInLists(old, created);
  }
  return {
    ...old,
    data: [created, ...old.data],
    meta: { ...old.meta, total: old.meta.total + 1 },
  };
}

function isLeadListQuery(query: { queryKey: readonly unknown[] }): boolean {
  return query.queryKey[0] === 'leads' && query.queryKey[1] === 'list';
}

export function useLeads(apiParams: URLSearchParams) {
  const key = apiParams.toString();
  return useQuery({
    queryKey: leadKeys.list(key),
    queryFn: () => leadApi.getAll(apiParams),
    staleTime: 1000 * 60 * 2,
    ...LIST_QUERY_OPTIONS,
  });
}

export function useMonthlyCommitment() {
  return useQuery({
    queryKey: leadKeys.commitment(),
    queryFn: () => leadApi.getMonthlyCommitment(),
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLeadInput) => leadApi.create(data),
    onSuccess: (created) => {
      queryClient.setQueriesData<PaginatedResponse<Lead>>(
        { queryKey: leadKeys.all, predicate: isLeadListQuery },
        (old) => upsertLeadInLists(old, created),
      );
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: leadKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardStatKeys.all }),
      ]);
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLeadInput }) =>
      leadApi.update(id, data),
    onSuccess: (updated) => {
      queryClient.setQueriesData<PaginatedResponse<Lead>>(
        { queryKey: leadKeys.all, predicate: isLeadListQuery },
        (old) => patchLeadInLists(old, updated),
      );
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: leadKeys.all }),
        queryClient.invalidateQueries({ queryKey: dealKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardStatKeys.all }),
      ]);
    },
  });
}

export function useConvertLeadToDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, policyNo }: { id: string; policyNo: string }) =>
      leadApi.convertToDeal(id, policyNo),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: leadKeys.all }),
        queryClient.invalidateQueries({ queryKey: dealKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardStatKeys.all }),
      ]),
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => leadApi.delete(id),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: leadKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardStatKeys.all }),
      ]),
  });
}
