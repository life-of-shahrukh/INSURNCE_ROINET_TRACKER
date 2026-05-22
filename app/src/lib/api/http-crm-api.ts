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
  const res = await fetch(`${base()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
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

  updateDeal: (id, input) =>
    request<Deal>(`/api/deals/${id}`, { method: "PATCH", body: JSON.stringify(input) }),

  deleteDeal: (id) =>
    request<void>(`/api/deals/${id}`, { method: "DELETE" }),

  createPosp: (input) =>
    request<Posp>("/api/posp", { method: "POST", body: JSON.stringify(input) }),

  updatePosp: (id, input) =>
    request<Posp>(`/api/posp/${id}`, { method: "PATCH", body: JSON.stringify(input) }),

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
