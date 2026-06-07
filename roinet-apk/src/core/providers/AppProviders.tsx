import { type ReactNode } from 'react';

import { AuthProvider } from '@/core/providers/AuthProvider';
import { CrmProvider } from '@/core/providers/CrmProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CrmProvider>{children}</CrmProvider>
    </AuthProvider>
  );
}
