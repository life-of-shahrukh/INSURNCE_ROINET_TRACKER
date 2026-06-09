import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadApi, CreateLeadInput, LeadStatus } from '../lib/api/lead-api';

export const leadKeys = {
  all: ['leads'] as const,
  lists: () => [...leadKeys.all, 'list'] as const,
  commitment: () => [...leadKeys.all, 'commitment'] as const,
};

export function useLeads() {
  return useQuery({
    queryKey: leadKeys.lists(),
    queryFn: () => leadApi.getAll(),
    staleTime: 1000 * 60 * 2,
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leadKeys.all }),
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateLeadInput> & { status?: LeadStatus } }) =>
      leadApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leadKeys.all }),
  });
}

export function useConvertLeadToDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => leadApi.convertToDeal(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leadKeys.all }),
  });
}
