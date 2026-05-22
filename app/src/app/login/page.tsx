"use client";

import Link from "next/link";
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

  function fillAdminDemoCredentials() {
    setEmail("admin@roinet.com");
    setPassword("admin123");
  }

  return (
    <div className="auth-shell">
      <form className="auth-card" onSubmit={onSubmit}>
        <h1 className="auth-title">Login</h1>
        <p className="auth-subtitle">Sign in as Admin or POSP to access the CRM portal.</p>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            placeholder="you@example.com"
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
          {busy ? "Signing in..." : "Login"}
        </button>

        <button className="btn btn-secondary" type="button" onClick={fillAdminDemoCredentials}>
          Use Admin Login (Demo)
        </button>

        <p className="auth-footnote">
          POSP user? <Link href="/signup">Create an account</Link> | Admin can login directly here.
        </p>
      </form>
    </div>
  );
}
