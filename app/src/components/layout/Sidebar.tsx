"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

function LogoutIcon() {
  return (
    <svg
      className="nav-icon-svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

const NAV = [
  { href: "/dashboard", icon: "⌂", label: "Dashboard" },
  { href: "/leads", icon: "◎", label: "Leads Pipeline" },
  { href: "/deals", icon: "▤", label: "Deals Tracker" },
  { href: "/posp", icon: "◉", label: "POSP Roster" },
  { href: "/renewals", icon: "↻", label: "Renewals" },
  { href: "/commissions", icon: "₹", label: "Commissions" },
  { href: "/reports", icon: "▦", label: "Reports" },
  { href: "/api-reference", icon: "⊞", label: "API Reference" },
] as const;

const POSP_NAV = new Set(["/dashboard", "/renewals", "/api-reference"]);

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const visibleNav = isAdmin
    ? NAV
    : NAV.filter((item) => POSP_NAV.has(item.href));

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-inner">
        <div className="logo">
          <div className="logo-title">Roinet Insurance</div>
          <div className="logo-sub">Brokers — Sales CRM</div>
          <div className="logo-role">{isAdmin ? "Admin" : "POSP"}</div>
        </div>
        <nav className="sidebar-nav" aria-label="Main navigation">
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
        </nav>
        <div className="sidebar-footer">
          <button
            type="button"
            className="nav-item nav-logout"
            onClick={handleLogout}
            aria-label="Log out"
          >
            <span className="nav-icon">
              <LogoutIcon />
            </span>
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
