import type { CrmApi } from "./crm-api";
import type { CrmState, Deal, DealInput, Posp, PospInput } from "../types";

const base = () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem("roinet_access_token");
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${base()}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  } catch (err) {
    throw new Error(
      `Network error: unable to reach server at ${base()}${path}`,
    );
  }
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error(`Unauthorized: ${path} — please log in again`);
    }
    let detail = "";
    try {
      const body = (await res.json()) as { message?: string };
      detail = body.message ? ` — ${body.message}` : "";
    } catch {}
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
    const { id: _id, ...body } = input;
    return request<Deal>(`/api/deals/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  },

  deleteDeal: (id) =>
    request<void>(`/api/deals/${id}`, { method: "DELETE" }),

  createPosp: (input) =>
    request<Posp>("/api/posp", { method: "POST", body: JSON.stringify(input) }),

  updatePosp: (id, input) => {
    const { id: _id, ...body } = input;
    return request<Posp>(`/api/posp/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  },

  exportDealsCsv: () =>
    fetch(`${base()}/api/deals/export`, {
      headers: {
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
    }).then((r) => {
      if (!r.ok) throw new Error("Export failed");
      return r.text();
    }),
};
