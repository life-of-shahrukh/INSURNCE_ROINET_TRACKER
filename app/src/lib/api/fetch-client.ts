import type { PaginatedResponse } from "./pagination-types";

// Browser: use relative URL so requests go through ALB (/api/* → backend).
// Server-side (SSR/build): use NEXT_PUBLIC_API_URL or localhost fallback.
const base = () =>
  typeof window !== "undefined"
    ? ""
    : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${base()}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch {
    throw new Error(`Network error: unable to reach server at ${base()}${path}`);
  }

  if (!res.ok) {
    let detail = "";
    try {
      const body = (await res.json()) as { message?: string };
      detail = body.message ? ` — ${body.message}` : "";
    } catch { /* empty */ }
    throw new Error(`API ${res.status}: ${path}${detail}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function fetchPaginated<T>(
  path: string,
  params?: URLSearchParams,
): Promise<PaginatedResponse<T>> {
  const qs = params?.toString();
  return request<PaginatedResponse<T>>(qs ? `${path}?${qs}` : path);
}

export { request, base as apiBase };
