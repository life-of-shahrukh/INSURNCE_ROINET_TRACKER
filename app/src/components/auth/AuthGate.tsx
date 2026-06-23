"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/providers/auth-provider";
import { hasMinRole } from "@/lib/auth-types";

const PUBLIC_PATHS = new Set(["/login", "/signup", "/sso/callback"]);

/**
 * Minimum role required to access each path prefix.
 * Routes not listed here are accessible by any authenticated user.
 */
const PATH_MIN_ROLE: Array<{ prefix: string; minRole: Parameters<typeof hasMinRole>[1] }> = [
  { prefix: "/sales-team",  minRole: "RH" },
  { prefix: "/commissions", minRole: "ASM" },
  { prefix: "/leads",       minRole: "POSP" },
  { prefix: "/deals",       minRole: "POSP" },
  { prefix: "/customers",   minRole: "POSP" },
  { prefix: "/reports",     minRole: "POSP" },
  { prefix: "/posp",        minRole: "DM" },
];

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, initializing } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (initializing) return;

    const isPublic = PUBLIC_PATHS.has(pathname);

    // Not logged in → login page (skip if already there)
    if (!user && !isPublic && pathname !== "/login") {
      router.replace("/login");
      return;
    }
    // Already logged in → dashboard (skip if already there)
    if (user && isPublic && pathname !== "/dashboard") {
      router.replace("/dashboard");
      return;
    }

    if (!user) return;

    // Role-based path guard
    for (const { prefix, minRole } of PATH_MIN_ROLE) {
      if (pathname.startsWith(prefix) && !hasMinRole(user.role, minRole)) {
        if (pathname !== "/dashboard") router.replace("/dashboard");
        return;
      }
    }
  }, [initializing, pathname, router, user]);

  if (initializing) {
    return (
      <div className="auth-shell">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24, marginBottom: 12 }}>⟳</div>
          <p>Checking session…</p>
        </div>
      </div>
    );
  }

  if (!user && !PUBLIC_PATHS.has(pathname)) {
    return (
      <div className="auth-shell">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <p>Redirecting to login…</p>
        </div>
      </div>
    );
  }

  // Inactive account notice
  if (user && user.status !== "ACTIVE") {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <h1 className="auth-title">Account Not Active</h1>
          <p className="auth-subtitle">
            Your account is <strong>{user.status.toLowerCase()}</strong>. Please contact your
            administrator to activate it.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
