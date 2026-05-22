"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { CrmProvider } from "@/providers/crm-provider";
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
    <CrmProvider>
      <div className="crm-shell">
        <Sidebar />
        <main className="main">{children}</main>
      </div>
    </CrmProvider>
  );
}
