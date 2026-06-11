"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // Redirect unknown routes to login; AuthGate will forward to dashboard if logged in
    router.replace("/login");
  }, [router]);

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <p>Page not found — redirecting…</p>
      </div>
    </div>
  );
}
