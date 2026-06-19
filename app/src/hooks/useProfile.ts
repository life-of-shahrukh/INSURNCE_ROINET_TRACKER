import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { profileApi, type ProfileResponse } from '../lib/api/profile-api';
import { useAuth } from '@/providers/auth-provider';

export function useProfile(): UseQueryResult<ProfileResponse, Error> {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', 'me', user?.id],
    queryFn: () => profileApi.getMe(),
    enabled: Boolean(user?.id),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30,   // 30 minutes
    retry: 1,
  });
}
