/**
 * React Query Hooks for External RoiNet Cognitensor API
 * 
 * These hooks provide a clean interface for fetching location
 * and hierarchy data with automatic caching and refetching.
 */

import { keepPreviousData, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { externalApi } from '../lib/api/external-api';
import type { State, District, City, HierarchyUser, PospData } from '../lib/external-api-types';
import type { PaginatedResponse } from '../lib/api/pagination-types';

/**
 * Query keys for external API
 */
export const externalApiKeys = {
  all: ['external-api'] as const,
  states: () => [...externalApiKeys.all, 'states'] as const,
  districts: (stateId: string) =>
    [...externalApiKeys.all, 'districts', stateId] as const,
  cities: (districtId: string) =>
    [...externalApiKeys.all, 'cities', districtId] as const,
  hierarchy: () => [...externalApiKeys.all, 'hierarchy'] as const,
};

/**
 * Hook to fetch all states
 */
export function useStates(): UseQueryResult<State[], Error> {
  return useQuery({
    queryKey: externalApiKeys.states(),
    queryFn: () => externalApi.getStates(),
    staleTime: 1000 * 60 * 60, // 1 hour - states rarely change
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

/**
 * Hook to fetch districts for a state
 */
export function useDistricts(
  stateId: string | null,
): UseQueryResult<District[], Error> {
  return useQuery({
    queryKey: externalApiKeys.districts(stateId ?? ''),
    queryFn: () => externalApi.getDistricts(stateId!),
    enabled: !!stateId, // Only fetch if stateId is provided
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });
}

/**
 * Hook to fetch cities for a district
 */
export function useCities(
  districtId: string | null,
): UseQueryResult<City[], Error> {
  return useQuery({
    queryKey: externalApiKeys.cities(districtId ?? ''),
    queryFn: () => externalApi.getCities(districtId!),
    enabled: !!districtId, // Only fetch if districtId is provided
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });
}

/**
 * Hook to fetch hierarchy user data
 */
export function useHierarchyUserData(): UseQueryResult<HierarchyUser[], Error> {
  return useQuery({
    queryKey: externalApiKeys.hierarchy(),
    queryFn: () => externalApi.getHierarchyUserData(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
}

/**
 * Hook to fetch paginated + filtered POSP list from Cognitensor (via NestJS proxy)
 */
export function useExternalPosps(
  params?: URLSearchParams,
): UseQueryResult<PaginatedResponse<PospData>, Error> {
  const key = params?.toString() ?? '';
  return useQuery({
    queryKey: [...externalApiKeys.all, 'posps', key],
    queryFn: () => externalApi.getPosps(params),
    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: 1000 * 60 * 60,    // 1 hour
    placeholderData: keepPreviousData,
  });
}

/**
 * Hook for cascading location selection (State -> District -> City)
 * Returns states, districts, and cities based on current selection
 */
export function useLocationCascade(stateId: string | null, districtId: string | null) {
  const states = useStates();
  const districts = useDistricts(stateId);
  const cities = useCities(districtId);

  return {
    states: {
      data: states.data ?? [],
      isLoading: states.isLoading,
      error: states.error,
    },
    districts: {
      data: districts.data ?? [],
      isLoading: districts.isLoading,
      error: districts.error,
      enabled: !!stateId,
    },
    cities: {
      data: cities.data ?? [],
      isLoading: cities.isLoading,
      error: cities.error,
      enabled: !!districtId,
    },
  };
}
