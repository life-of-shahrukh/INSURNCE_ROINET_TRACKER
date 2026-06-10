import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi, CreateCustomerInput } from '../lib/api/customer-api';
import { LIST_QUERY_OPTIONS } from '@/lib/query/list-query-options';

export const customerKeys = {
  all: ['customers'] as const,
  list: (params: string) => [...customerKeys.all, 'list', params] as const,
  search: (query: string) => [...customerKeys.all, 'search', query] as const,
};

export function useCustomers(apiParams: URLSearchParams) {
  const key = apiParams.toString();
  return useQuery({
    queryKey: customerKeys.list(key),
    queryFn: () => customerApi.getAll(apiParams),
    staleTime: 1000 * 60 * 5,
    ...LIST_QUERY_OPTIONS,
  });
}

export function useSearchCustomers(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: customerKeys.search(query),
    queryFn: () => customerApi.search(query),
    enabled: enabled && query.length >= 2,
    staleTime: 1000 * 30,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCustomerInput) => customerApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customerKeys.all }),
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCustomerInput> }) =>
      customerApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customerKeys.all }),
  });
}
