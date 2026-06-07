import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { TOKEN_KEY, USER_KEY } from '@/core/constants';
import { getFriendlyAuthErrorMessage } from '@/features/auth/services/auth-errors';
import { loginRequest, signupPospRequest } from '@/features/auth/services';
import type { AuthUser, LoginPayload, SignupPospPayload } from '@/features/auth/types/auth.types';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  initializing: boolean;
  isAdmin: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  signupPosp: (payload: SignupPospPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function persistSession(accessToken: string, authUser: AuthUser): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, accessToken);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(authUser));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    async function restore() {
      try {
        const savedToken = await AsyncStorage.getItem(TOKEN_KEY);
        const savedUser = await AsyncStorage.getItem(USER_KEY);
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser) as AuthUser);
        }
      } catch (err) {
        console.error('[Auth] Failed to restore session:', err);
      } finally {
        setInitializing(false);
      }
    }
    void restore();
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    try {
      const data = await loginRequest(payload);
      setToken(data.accessToken);
      setUser(data.user);
      await persistSession(data.accessToken, data.user);
    } catch (err) {
      throw new Error(getFriendlyAuthErrorMessage(err));
    }
  }, []);

  const signupPosp = useCallback(async (payload: SignupPospPayload) => {
    try {
      const data = await signupPospRequest(payload);
      setToken(data.accessToken);
      setUser(data.user);
      await persistSession(data.accessToken, data.user);
    } catch (err) {
      throw new Error(getFriendlyAuthErrorMessage(err));
    }
  }, []);

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      initializing,
      isAdmin: user?.role === 'ADMIN',
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
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
