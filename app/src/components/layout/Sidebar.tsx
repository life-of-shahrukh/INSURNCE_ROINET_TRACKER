"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard", icon: "⌂", label: "Dashboard" },
  { href: "/leads", icon: "◎", label: "Leads Pipeline" },
  { href: "/deals", icon: "▤", label: "Deals Tracker" },
  { href: "/posp", icon: "◉", label: "POSP Roster" },
  { href: "/renewals", icon: "↻", label: "Renewals" },
  { href: "/commissions", icon: "₹", label: "Commissions" },
  { href: "/reports", icon: "▦", label: "Reports" },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-title">Roinet Insurance</div>
        <div className="logo-sub">Brokers — Sales CRM</div>
      </div>
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`nav-item ${pathname === item.href ? "active" : ""}`}
        >
          <span className="nav-icon">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </aside>
  );
}
