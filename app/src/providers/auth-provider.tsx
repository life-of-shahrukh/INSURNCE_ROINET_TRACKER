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
const TOKEN_KEY = "roinet_access_token";
const USER_KEY = "roinet_user";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  initializing: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  signupPosp: (payload: SignupPospPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let parsed: unknown = null;
    try {
      parsed = (await res.json()) as unknown;
    } catch {
      parsed = null;
    }
    throw toAuthApiError(parsed, res.status);
  }
  return res.json() as Promise<T>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const savedToken = window.localStorage.getItem(TOKEN_KEY);
    const savedUser = window.localStorage.getItem(USER_KEY);
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser) as AuthUser);
    }
    setInitializing(false);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const data = await apiRequest<{ accessToken: string; user: AuthUser }>(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
    setToken(data.accessToken);
    setUser(data.user);
    window.localStorage.setItem(TOKEN_KEY, data.accessToken);
    window.localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }, []);

  const signupPosp = useCallback(async (payload: SignupPospPayload) => {
    const data = await apiRequest<{ accessToken: string; user: AuthUser }>(
      "/api/auth/signup-posp",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
    setToken(data.accessToken);
    setUser(data.user);
    window.localStorage.setItem(TOKEN_KEY, data.accessToken);
    window.localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      initializing,
      login,
      signupPosp,
      logout,
    }),
    [user, token, initializing, login, signupPosp, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
