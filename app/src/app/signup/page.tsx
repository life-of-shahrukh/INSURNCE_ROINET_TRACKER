"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { getFriendlyAuthErrorMessage } from "@/lib/auth-errors";

export default function SignupPage() {
  const { signupPosp } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState("");
  const [password, setPassword] = useState("");
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await signupPosp({
        name,
        code,
        mobile,
        email,
        joined,
        active,
        password,
      });
      setSuccess("Signup successful. Redirecting to dashboard...");
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
        <h1 className="auth-title">POSP Signup</h1>
        <p className="auth-subtitle">Create your POSP login for direct access.</p>

        <div className="form-grid">
          <div className="form-group">
            <label>Full Name</label>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              required
              className={error ? "auth-input-error" : ""}
            />
          </div>
          <div className="form-group">
            <label>POSP Code</label>
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (error) setError(null);
              }}
              required
              className={error ? "auth-input-error" : ""}
            />
          </div>
          <div className="form-group">
            <label>Mobile</label>
            <input
              value={mobile}
              onChange={(e) => {
                setMobile(e.target.value);
                if (error) setError(null);
              }}
              required
              className={error ? "auth-input-error" : ""}
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              required
              className={error ? "auth-input-error" : ""}
            />
          </div>
          <div className="form-group">
            <label>Joined Date</label>
            <input
              type="date"
              value={joined}
              onChange={(e) => {
                setJoined(e.target.value);
                if (error) setError(null);
              }}
              required
              className={error ? "auth-input-error" : ""}
            />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select
              value={active ? "true" : "false"}
              onChange={(e) => setActive(e.target.value === "true")}
              className={error ? "auth-input-error" : ""}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div className="form-group full">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              minLength={6}
              required
              className={error ? "auth-input-error" : ""}
            />
          </div>
        </div>

        {error ? (
          <div className="auth-error" role="alert" aria-live="polite">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="auth-success" role="status" aria-live="polite">
            {success}
          </div>
        ) : null}

        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Submitting..." : "Submit Signup"}
        </button>

        <p className="auth-footnote">
          Already have an account? <Link href="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
