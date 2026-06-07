import { Redirect } from 'expo-router';

import { LoadingState } from '@/shared/components/LoadingState';
import { useAuth } from '@/core/providers/AuthProvider';

export default function IndexScreen() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return <LoadingState message="Starting Roinet CRM…" />;
  }

  if (user) {
    return <Redirect href="/(crm)/dashboard" />;
  }

  return <Redirect href="/login" />;
}
