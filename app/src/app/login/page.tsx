"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { getFriendlyAuthErrorMessage } from "@/lib/auth-errors";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  return (
    <div className="auth-shell">
      <form className="auth-card" onSubmit={onSubmit}>
        <div className="logo" style={{ marginBottom: 20 }}>
          <div className="logo-title" style={{ color: "var(--primary)", fontSize: 20 }}>
            Roinet Insurance
          </div>
          <div className="logo-sub">Brokers — Sales CRM</div>
        </div>

        <h1 className="auth-title">Sign In</h1>
        <p className="auth-subtitle">
          Enter your credentials to access the CRM portal.
        </p>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); }}
            placeholder="you@roinet.com"
            required
            className={error ? "auth-input-error" : ""}
            autoComplete="username"
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(null); }}
            placeholder="••••••••"
            required
            className={error ? "auth-input-error" : ""}
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div className="auth-error" role="alert" aria-live="polite">
            {error}
          </div>
        )}

        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign In"}
        </button>

        <p className="auth-footnote" style={{ marginTop: 16 }}>
          Accounts are provisioned by your organisation administrator.
        </p>
      </form>
    </div>
  );
}
