import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_BASE_URL, TOKEN_KEY } from '@/core/constants';

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getToken();
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new Error(`Network error: unable to reach server at ${API_BASE_URL}${path}`);
  }

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error(`Unauthorized: ${path} — please log in again`);
    }
    let detail = '';
    try {
      const body = (await res.json()) as { message?: string };
      detail = body.message ? ` — ${body.message}` : '';
    } catch {
      detail = '';
    }
    throw new Error(`API ${res.status}: ${path}${detail}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
