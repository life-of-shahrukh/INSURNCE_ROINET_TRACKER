import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadApi, CreateLeadInput, LeadStatus } from '../lib/api/lead-api';
import { LIST_QUERY_OPTIONS } from '@/lib/query/list-query-options';
import { dealKeys } from '@/hooks/useDealsList';
import { dashboardStatKeys } from '@/hooks/useDashboardStats';

export const leadKeys = {
  all: ['leads'] as const,
  list: (params: string) => [...leadKeys.all, 'list', params] as const,
  commitment: () => [...leadKeys.all, 'commitment'] as const,
};

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
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: leadKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardStatKeys.all }),
      ]),
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateLeadInput> & { status?: LeadStatus } }) =>
      leadApi.update(id, data),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: leadKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardStatKeys.all }),
      ]),
  });
}

export function useConvertLeadToDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => leadApi.convertToDeal(id),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: leadKeys.all }),
        queryClient.invalidateQueries({ queryKey: dealKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardStatKeys.all }),
      ]),
  });
}
