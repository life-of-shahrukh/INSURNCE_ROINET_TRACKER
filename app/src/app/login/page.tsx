"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { getFriendlyAuthErrorMessage } from "@/lib/auth-errors";

const IS_DEV = process.env.NEXT_PUBLIC_AUTH_MODE === "dev";

const DEV_CREDENTIALS = [
  { label: "Super Admin",    email: "superadmin@roinet.com", password: "Admin@1234" },
  { label: "National Head",  email: "national@roinet.com",   password: "National@123" },
  { label: "Zonal Head",     email: "zonal@roinet.com",      password: "Zonal@1234" },
  { label: "Regional Head",  email: "regional@roinet.com",   password: "Regional@123" },
  { label: "ASM",            email: "asm@roinet.com",        password: "Asm@12345" },
  { label: "DM / CH",        email: "dm@roinet.com",         password: "Dm@123456" },
  { label: "POSP",           email: "posp@roinet.com",       password: "Posp@1234" },
  { label: "ZH (AP/TEL)",    email: "zh-south@seed.roinet.com", password: "Seed@1234" },
  { label: "ZH (North)",     email: "zh-north@seed.roinet.com", password: "Seed@1234" },
  { label: "RH (AP)",        email: "rh-ap@seed.roinet.com",    password: "Seed@1234" },
  { label: "RH (Delhi)",     email: "rh-dl@seed.roinet.com",    password: "Seed@1234" },
  { label: "ASM (Hyd)",      email: "asm-hyd@seed.roinet.com",  password: "Seed@1234" },
  { label: "ASM (Bengaluru)",email: "asm-blr@seed.roinet.com",  password: "Seed@1234" },
  { label: "DM (Hyd Central)",email: "dm-hyd-c@seed.roinet.com",password: "Seed@1234" },
  { label: "DM (Delhi)",     email: "dm-ndl-c@seed.roinet.com", password: "Seed@1234" },
] as const;

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

  async function quickLogin(cred: { email: string; password: string }) {
    setEmail(cred.email);
    setPassword(cred.password);
    setError(null);
    setBusy(true);
    try {
      // Clear any existing session first so the new role takes effect immediately.
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
      await login({ email: cred.email, password: cred.password });
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

        {IS_DEV && (
          <div style={{
            background: "#fffbe6",
            border: "1px solid #f0c040",
            borderRadius: 8,
            padding: "10px 12px",
            marginBottom: 16,
          }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#92700a", marginBottom: 8 }}>
              DEV MODE — quick login
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {DEV_CREDENTIALS.map((c) => (
                <button
                  key={c.email}
                  type="button"
                  onClick={() => quickLogin(c)}
                  style={{
                    fontSize: 11,
                    padding: "3px 8px",
                    border: "1px solid #d4a800",
                    borderRadius: 4,
                    background: email === c.email ? "#f0c040" : "#fff",
                    cursor: "pointer",
                    fontWeight: email === c.email ? 700 : 400,
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )}

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
          {IS_DEV
            ? "Dev mode: direct email/password login active for all roles."
            : "Accounts are provisioned by your organisation administrator."}
        </p>
      </form>
    </div>
  );
}
