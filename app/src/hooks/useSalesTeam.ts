import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesTeamApi, CreateSalesTeamInput } from '../lib/api/sales-team-api';
import { hierarchyApi, type OrgChartNode } from '../lib/api/hierarchy-api';
import { LIST_QUERY_OPTIONS } from '@/lib/query/list-query-options';
export type { OrgChartNode as OrgNode } from '../lib/api/hierarchy-api';

export const teamKeys = {
  all: ['sales-team'] as const,
  lists: () => [...teamKeys.all, 'list'] as const,
  hierarchy: () => [...teamKeys.all, 'hierarchy'] as const,
  orgChart: () => [...teamKeys.all, 'org-chart'] as const,
};

export function useSalesTeam(apiParams: URLSearchParams) {
  const key = apiParams.toString();
  return useQuery({
    queryKey: [...teamKeys.lists(), key],
    queryFn: () => salesTeamApi.getAll(apiParams),
    staleTime: 1000 * 60 * 5,
    ...LIST_QUERY_OPTIONS,
  });
}

export function useTeamHierarchy() {
  return useQuery({
    queryKey: teamKeys.hierarchy(),
    queryFn: () => salesTeamApi.getHierarchy(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateSalesTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSalesTeamInput) => salesTeamApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teamKeys.all }),
  });
}

export function useUpdateSalesTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSalesTeamInput> & { status?: string } }) =>
      salesTeamApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teamKeys.all }),
  });
}

export function useOrgChart() {
  return useQuery({
    queryKey: teamKeys.orgChart(),
    queryFn: () => hierarchyApi.getOrgChart(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useSyncTeamFromApi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => salesTeamApi.syncFromApi(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teamKeys.all }),
  });
}
