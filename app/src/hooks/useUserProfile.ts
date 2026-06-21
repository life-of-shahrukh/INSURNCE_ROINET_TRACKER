import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { profileApi, type ProfileResponse } from '../lib/api/profile-api';

export function useUserProfile(
  userCode: string | null,
  enabled = true,
): UseQueryResult<ProfileResponse, Error> {
  const code = userCode?.trim() ?? '';

  return useQuery({
    queryKey: ['profile', 'by-code', code],
    queryFn: () => profileApi.getByUserCode(code),
    enabled: enabled && code.length > 0,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 1,
  });
}
