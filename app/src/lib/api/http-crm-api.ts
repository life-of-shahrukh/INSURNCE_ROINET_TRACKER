import type { CrmApi } from "./crm-api";
import type { Deal, Posp } from "../types";

const base = () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/**
 * Clear the HttpOnly cookie via the logout endpoint, then navigate to /login.
 * Uses Next.js router when available so RSC cache is preserved; falls back to
 * window.location for non-React contexts.
 */
async function clearSessionAndRedirect() {
  try {
    await fetch(`${base()}/api/auth/logout`, { method: "POST", credentials: "include" });
  } catch { /* best-effort */ }

  if (typeof window !== "undefined") {
    // Use Next.js client router to avoid RSC 404 on hard reload
    const { default: Router } = await import("next/router").catch(() => ({ default: null }));
    if (Router?.replace) {
      void Router.replace("/login");
    } else {
      window.location.replace("/login");
    }
  }
}

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
    // 401 = expired / missing token  |  403 with "role" in message = stale role in old JWT
    if (res.status === 401) {
      void clearSessionAndRedirect();
      throw new Error("Session expired — please log in again");
    }

    let detail = "";
    let body: { message?: string; statusCode?: number } = {};
    try { body = (await res.json()) as typeof body; } catch { /* empty */ }
    detail = body.message ? ` — ${body.message}` : "";

    if (res.status === 403 && body.message?.toLowerCase().includes("role:")) {
      void clearSessionAndRedirect();
      throw new Error("Session outdated — please log in again");
    }

    throw new Error(`API ${res.status}: ${path}${detail}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const httpCrmApi: CrmApi = {
  getState: () =>
    Promise.all([
      request<Posp[]>("/api/posp"),
      request<Deal[]>("/api/deals"),
    ]).then(([posp, deals]) => ({ posp, deals })),

  createDeal: (input) =>
    request<Deal>("/api/deals", { method: "POST", body: JSON.stringify(input) }),

  updateDeal: (id, input) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _dealId, ...body } = input;
    return request<Deal>(`/api/deals/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  },

  deleteDeal: (id) => request<void>(`/api/deals/${id}`, { method: "DELETE" }),

  createPosp: (input) =>
    request<Posp>("/api/posp", { method: "POST", body: JSON.stringify(input) }),

  updatePosp: (id, input) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _pospId, ...body } = input;
    return request<Posp>(`/api/posp/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  },

  exportDealsCsv: () =>
    fetch(`${base()}/api/deals/export`, { credentials: "include" }).then((r) => {
      if (!r.ok) throw new Error("Export failed");
      return r.text();
    }),
};
