"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

export default function SsoCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { ssoLogin } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const attempted = useRef(false);

  useEffect(() => {
    // Guard against double-invoke in React StrictMode
    if (attempted.current) return;
    attempted.current = true;

    const token = searchParams.get("token");
    const isPosp = searchParams.get("isPosp") === "true";

    if (!token) {
      setError("Missing SSO token in redirect URL. Please try again or contact support.");
      return;
    }

    ssoLogin(token, isPosp)
      .then(() => {
        router.replace("/dashboard");
      })
      .catch((err: unknown) => {
        const msg =
          err instanceof Error
            ? err.message
            : "SSO verification failed. Please try again or contact support.";
        setError(msg);
      });
  }, [searchParams, router, ssoLogin]);

  if (error) {
    return (
      <div className="auth-shell">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 40,
              marginBottom: 16,
              color: "var(--error, #dc2626)",
            }}
          >
            ✕
          </div>
          <h1 className="auth-title">SSO Login Failed</h1>
          <p className="auth-subtitle" style={{ color: "var(--error, #dc2626)" }}>
            {error}
          </p>
          <button
            className="btn"
            style={{ marginTop: 24 }}
            onClick={() => router.replace("/login")}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 36,
            marginBottom: 16,
            animation: "spin 1s linear infinite",
          }}
        >
          ⟳
        </div>
        <h1 className="auth-title">Completing Sign In…</h1>
        <p className="auth-subtitle">Verifying your SSO session, please wait.</p>
      </div>
    </div>
  );
}
