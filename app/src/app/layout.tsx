import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
