"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { hasMinRole, type UserRole } from "@/lib/auth-types";

function LogoutIcon() {
  return (
    <svg className="nav-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

interface NavItem {
  href: string;
  icon: string;
  label: string;
  minRole?: UserRole;  // minimum role required; absent = all roles
  pospOnly?: boolean;  // only POSP can see this
}

const NAV: NavItem[] = [
  { href: "/dashboard",   icon: "⌂", label: "Dashboard" },
  { href: "/leads",       icon: "◎", label: "Leads Pipeline",  minRole: "DM"  },
  { href: "/deals",       icon: "▤", label: "Deals Tracker",   minRole: "DM"  },
  { href: "/customers",   icon: "◈", label: "Customers",       minRole: "DM"  },
  { href: "/posp",        icon: "◉", label: "POSP Roster",     minRole: "DM"  },
  { href: "/sales-team",  icon: "⊛", label: "Sales Team",      minRole: "RH"  },
  { href: "/org-chart",   icon: "⬡", label: "Org Chart",       minRole: "RH"  },
  { href: "/renewals",    icon: "↻", label: "Renewals" },
  { href: "/commissions", icon: "₹", label: "Commissions",     minRole: "ASM" },
  { href: "/reports",     icon: "▦", label: "Reports",         minRole: "ASM" },
  { href: "/profile",     icon: "◎", label: "My Profile" },
];

const ROLE_LABEL: Record<UserRole, string> = {
  SUPER_ADMIN:   "Super Admin",
  NATIONAL_HEAD: "National Head",
  ZH:            "Zonal Head",
  RH:            "Regional Head",
  ASM:           "Area Sales Mgr",
  DM:            "District Mgr",
  POSP:          "POSP Agent",
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const role = user?.role;

  const visibleNav = NAV.filter((item) => {
    if (!item.minRole) return true;  // no restriction
    if (!role) return false;
    return hasMinRole(role, item.minRole);
  });

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
          <Link href="/profile" className="logo-role" style={{ textDecoration: "none", cursor: "pointer" }}>
            {role ? ROLE_LABEL[role] : ""}
          </Link>
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
          <button type="button" className="nav-item nav-logout" onClick={handleLogout} aria-label="Log out">
            <span className="nav-icon"><LogoutIcon /></span>
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
