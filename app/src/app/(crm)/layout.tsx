"use client";

import { Suspense } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { CrmProvider } from "@/providers/crm-provider";
import { ReactQueryProvider } from "@/providers/react-query-provider";
import { PrimeProvider } from "@/providers/prime-provider";
import { useAuth } from "@/providers/auth-provider";
import { AnnouncementBanner } from "@/components/announcement/AnnouncementBanner";

function CrmShell({ children }: { children: React.ReactNode }) {
  return (
    <PrimeProvider>
      <ReactQueryProvider>
        <CrmProvider>
          <div className="crm-shell">
            <Sidebar />
            <main className="main">
              <AnnouncementBanner />
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
