"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { getFriendlyAuthErrorMessage } from "@/lib/auth-errors";

// The redirect_uri back to /sso/xpresso/callback is pre-registered on the
// Xpresso server side — we just send the user to the Xpresso login page.
const XPRESSO_SSO_URL =
  process.env.NEXT_PUBLIC_XPRESSO_SSO_URL ??
  "https://uatxpro.roinet.in/Login.aspx";

function handleXpressoSso() {
  globalThis.location.href = XPRESSO_SSO_URL;
}

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

        <div className="auth-sso-divider">
          <span>or</span>
        </div>

        <button
          type="button"
          className="btn-xpresso-sso"
          onClick={handleXpressoSso}
          disabled={busy}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            style={{ flexShrink: 0 }}
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
            <path
              d="M8 12h8M14 9l3 3-3 3"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Sign in with Xpresso SSO
        </button>

        <p className="auth-footnote" style={{ marginTop: 4 }}>
          Accounts are provisioned by your organisation administrator.
        </p>
      </form>
    </div>
  );
}
