import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { profileApi, type ProfileResponse } from '../lib/api/profile-api';

const PROFILE_QUERY_KEY = ['profile', 'me'];

export function useProfile(): UseQueryResult<ProfileResponse, Error> {
  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: () => profileApi.getMe(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30,   // 30 minutes
    retry: 1,
  });
}
