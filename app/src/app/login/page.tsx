"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { getFriendlyAuthErrorMessage } from "@/lib/auth-errors";

type LoginRole = "admin" | "posp";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<LoginRole>("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function switchRole(next: LoginRole) {
    if (next === role) return;
    setRole(next);
    setError(null);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login({ email, password });
      router.replace("/dashboard");
    } catch (err) {
      setError(getFriendlyAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function fillAdminDemoCredentials() {
    setEmail("admin@roinet.com");
    setPassword("Admin@1234");
  }

  return (
    <div className="auth-shell">
      <form className="auth-card" onSubmit={onSubmit}>
        <div className="auth-role-toggle" role="tablist" aria-label="Login role">
          <button
            type="button"
            role="tab"
            aria-selected={isAdmin}
            className={`auth-role-toggle-btn${isAdmin ? " is-active" : ""}`}
            onClick={() => switchRole("admin")}
          >
            Admin
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!isAdmin}
            className={`auth-role-toggle-btn${!isAdmin ? " is-active" : ""}`}
            onClick={() => switchRole("posp")}
          >
            POSP
          </button>
        </div>

        <h1 className="auth-title">Login</h1>
        <p className="auth-subtitle">
          {isAdmin
            ? "Sign in with your admin credentials to manage the CRM."
            : "Sign in with your POSP credentials to access your deals and leads."}
        </p>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            placeholder={isAdmin ? "admin@roinet.com" : "you@example.com"}
            required
            className={error ? "auth-input-error" : ""}
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
            placeholder="••••••••"
            required
            className={error ? "auth-input-error" : ""}
          />
        </div>

        {error ? (
          <div className="auth-error" role="alert" aria-live="polite">
            {error}
          </div>
        ) : null}

        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Signing in..." : isAdmin ? "Login as Admin" : "Login as POSP"}
        </button>

        <div className="auth-create-account">
          {isAdmin ? (
            <p className="auth-footnote">Admin accounts are provisioned by your organization.</p>
          ) : (
            <p className="auth-footnote">
              Don&apos;t have a POSP account?{" "}
              <Link href="/signup">Create an account</Link>
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
