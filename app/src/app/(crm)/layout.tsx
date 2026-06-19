"use client";

import { Suspense, useEffect, useRef } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { CrmProvider } from "@/providers/crm-provider";
import { ReactQueryProvider } from "@/providers/react-query-provider";
import { PrimeProvider } from "@/providers/prime-provider";
import { useAuth } from "@/providers/auth-provider";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Watches for user-id changes (i.e. switching between accounts) and clears
 * the entire React Query cache so no previous user's data bleeds through.
 * Must live inside ReactQueryProvider.
 */
function AuthCacheSync() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const prevId = prevUserIdRef.current;
    const nextId = user?.id ?? null;

    // undefined means first mount — don't clear on initial load
    if (prevId !== undefined && prevId !== nextId) {
      queryClient.clear();
    }
    prevUserIdRef.current = nextId;
  }, [user?.id, queryClient]);

  return null;
}

function CrmShell({ children }: { children: React.ReactNode }) {
  return (
    <PrimeProvider>
      <ReactQueryProvider>
        <AuthCacheSync />
        <CrmProvider>
          <div className="crm-shell">
            <Sidebar />
            <main className="main">
              <Suspense fallback={null}>
                {children}
              </Suspense>
            </main>
          </div>
        </CrmProvider>
      </ReactQueryProvider>
    </PrimeProvider>
  );
}

export default function CrmLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, initializing } = useAuth();

  // While the session check is in flight, render nothing — AuthGate
  // shows its own "Checking session…" spinner so no extra UI is needed.
  if (initializing || !user) {
    return null;
  }

  return <CrmShell>{children}</CrmShell>;
}
