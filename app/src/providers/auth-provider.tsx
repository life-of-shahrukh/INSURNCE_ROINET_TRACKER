"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser, LoginPayload, SignupPospPayload } from "@/lib/auth-types";
import { toAuthApiError } from "@/lib/auth-errors";
import { resetSessionClientState } from "@/lib/reset-session-state";

// In the browser the ALB routes /api/* → backend, so relative URLs are enough.
// During SSR (server-side) we need an absolute URL to reach the backend container.
const getApiBase = () =>
  typeof window !== "undefined"
    ? ""
    : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000");

interface AuthContextValue {
  user: AuthUser | null;
  initializing: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  signupPosp: (payload: SignupPospPayload) => Promise<void>;
  ssoLogin: (token: string, isPosp: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** All auth requests use credentials:'include' so the HttpOnly cookie is sent. */
async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let parsed: unknown = null;
    try { parsed = await res.json(); } catch { /* empty */ }
    throw toAuthApiError(parsed, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  // On mount, call /api/auth/me to restore session from HttpOnly cookie.
  // Only call logout (and clear the cookie) on 401/403 — NOT on network errors,
  // so a slow backend restart doesn't wipe a valid session.
  useEffect(() => {
    apiRequest<AuthUser>("/api/auth/me")
      .then(setUser)
      .catch(async (err: unknown) => {
        const msg = err instanceof Error ? err.message : "";
        const isAuthError = /API 40[13]/.test(msg);
        if (isAuthError) {
          await fetch(`${getApiBase()}/api/auth/logout`, {
            method: "POST",
            credentials: "include",
          }).catch(() => {});
        }
        setUser(null);
      })
      .finally(() => setInitializing(false));
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const data = await apiRequest<AuthUser>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    resetSessionClientState();
    setUser(data);
  }, []);

  const signupPosp = useCallback(async (payload: SignupPospPayload) => {
    const data = await apiRequest<AuthUser & { message?: string }>("/api/auth/signup-posp", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    resetSessionClientState();
    setUser(data);
  }, []);

  const ssoLogin = useCallback(async (token: string, isPosp: boolean) => {
    const data = await apiRequest<AuthUser>("/api/v1/sso/verify-token", {
      method: "POST",
      body: JSON.stringify({ token, isPosp }),
    });
    resetSessionClientState();
    setUser(data);
  }, []);

  const logout = useCallback(async () => {
    await apiRequest<void>("/api/auth/logout", { method: "POST" }).catch(() => {});
    resetSessionClientState();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, initializing, login, signupPosp, ssoLogin, logout }),
    [user, initializing, login, signupPosp, ssoLogin, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
