/**
 * React Query Hooks for Customer API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi, CreateCustomerInput } from '../lib/api/customer-api';

export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  search: (query: string) => [...customerKeys.all, 'search', query] as const,
};

export function useCustomers() {
  return useQuery({
    queryKey: customerKeys.lists(),
    queryFn: () => customerApi.getAll(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useSearchCustomers(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: customerKeys.search(query),
    queryFn: () => customerApi.search(query),
    enabled: enabled && query.length >= 2,
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCustomerInput) => customerApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCustomerInput> }) =>
      customerApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
    },
  });
}
