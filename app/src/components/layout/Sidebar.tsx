"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

const NAV = [
  { href: "/dashboard", icon: "⌂", label: "Dashboard" },
  { href: "/leads", icon: "◎", label: "Leads Pipeline" },
  { href: "/deals", icon: "▤", label: "Deals Tracker" },
  { href: "/posp", icon: "◉", label: "POSP Roster" },
  { href: "/renewals", icon: "↻", label: "Renewals" },
  { href: "/commissions", icon: "₹", label: "Commissions" },
  { href: "/reports", icon: "▦", label: "Reports" },
] as const;

const POSP_NAV = new Set(["/dashboard", "/renewals"]);

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const visibleNav = isAdmin
    ? NAV
    : NAV.filter((item) => POSP_NAV.has(item.href));

  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-title">Roinet Insurance</div>
        <div className="logo-sub">Brokers — Sales CRM</div>
        <div className="logo-role">{isAdmin ? "Admin" : "POSP"}</div>
      </div>
      {visibleNav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`nav-item ${pathname === item.href ? "active" : ""}`}
        >
          <span className="nav-icon">{item.icon}</span>
          {item.label}
        </Link>
      ))}
      <button className="nav-item nav-logout" onClick={logout}>
        <span className="nav-icon">↩</span>
        Logout
      </button>
    </aside>
  );
}
