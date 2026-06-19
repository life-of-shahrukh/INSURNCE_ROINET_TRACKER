import { API_BASE_URL } from '@/core/constants';
import type { LoginPayload, LoginResponse, SignupPospPayload } from '@/features/auth/types/auth.types';
import { toAuthApiError } from '@/features/auth/services/auth-errors';

export async function loginRequest(payload: LoginPayload): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
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
  return res.json() as Promise<LoginResponse>;
}

export async function signupPospRequest(payload: SignupPospPayload): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/signup-posp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
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
  return res.json() as Promise<LoginResponse>;
}
