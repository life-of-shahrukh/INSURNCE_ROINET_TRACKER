"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { CrmProvider } from "@/providers/crm-provider";
import { ReactQueryProvider } from "@/providers/react-query-provider";
import { useAuth } from "@/providers/auth-provider";

export default function CrmLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user } = useAuth();
  if (!user) {
    return null;
  }

  return (
    <ReactQueryProvider>
      <CrmProvider>
        <div className="crm-shell">
          <Sidebar />
          <main className="main">{children}</main>
        </div>
      </CrmProvider>
    </ReactQueryProvider>
  );
}
