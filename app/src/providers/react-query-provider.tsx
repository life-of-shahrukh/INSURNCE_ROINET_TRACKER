'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: process.env.NODE_ENV === 'production',
      },
      mutations: {
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    return makeQueryClient();
  }
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

/** Drop all cached API data when the signed-in user changes. */
export function clearBrowserQueryCache(): void {
  browserQueryClient?.clear();
}

export function ReactQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => getQueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
