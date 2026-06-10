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

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface AuthContextValue {
  user: AuthUser | null;
  initializing: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  signupPosp: (payload: SignupPospPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** All auth requests use credentials:'include' so the HttpOnly cookie is sent. */
async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
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
          await fetch(`${API_BASE}/api/auth/logout`, {
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
    setUser(data);
  }, []);

  const signupPosp = useCallback(async (payload: SignupPospPayload) => {
    const data = await apiRequest<AuthUser & { message?: string }>("/api/auth/signup-posp", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setUser(data);
  }, []);

  const logout = useCallback(async () => {
    await apiRequest<void>("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, initializing, login, signupPosp, logout }),
    [user, initializing, login, signupPosp, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
