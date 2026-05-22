"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/providers/auth-provider";

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { user, initializing } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (initializing) {
      return;
    }

    const isPublic = pathname === "/login" || pathname === "/signup";
    if (!user && !isPublic) {
      router.replace("/login");
      return;
    }
    if (user && isPublic) {
      router.replace("/dashboard");
    }
  }, [initializing, pathname, router, user]);

  if (initializing) {
    return <div className="empty">Checking session...</div>;
  }

  if (!user && pathname !== "/login" && pathname !== "/signup") {
    return <div className="empty">Redirecting to login...</div>;
  }

  if (
    user &&
    user.role === "POSP" &&
    user.status !== "ACTIVE" &&
    pathname !== "/login" &&
    pathname !== "/signup"
  ) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <h1 className="auth-title">Account Pending Approval</h1>
          <p className="auth-subtitle">
            Your POSP signup is complete. Please wait for admin approval before accessing the
            portal.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
