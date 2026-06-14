import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/providers/auth-provider";
import { AuthGate } from "@/components/auth/AuthGate";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Roinet Insurance Brokers — Sales CRM",
  description: "Sales CRM for Roinet Insurance Brokers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AuthProvider>
          <AuthGate>{children}</AuthGate>
        </AuthProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
