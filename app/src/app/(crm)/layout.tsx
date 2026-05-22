import { Sidebar } from "@/components/layout/Sidebar";
import { CrmProvider } from "@/providers/crm-provider";

export default function CrmLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <CrmProvider>
      <div className="crm-shell">
        <Sidebar />
        <main className="main">{children}</main>
      </div>
    </CrmProvider>
  );
}
