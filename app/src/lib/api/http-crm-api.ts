import type { CrmApi } from "./crm-api";
import type { Deal, Posp } from "../types";
import type { PaginatedResponse } from "./pagination-types";
import { fetchPaginated, request } from "./fetch-client";

/**
 * The Prisma model persists the customer name as `customerName`.
 * The frontend Deal type uses `customer`. This function normalises the raw
 * API payload so the rest of the app never has to worry about the mismatch.
 */
function normalizeDeal(raw: Record<string, unknown>): Deal {
  return {
    ...(raw as unknown as Deal),
    customer: (raw["customerName"] ?? raw["customer"] ?? "") as string,
    customerId: (raw["customerId"] ?? null) as string | null,
  };
}

export const httpCrmApi: CrmApi = {
  listDeals: (params) =>
    fetchPaginated<Deal>("/api/deals", params).then((res) => ({
      ...res,
      data: res.data.map((d) => normalizeDeal(d as unknown as Record<string, unknown>)),
    })),

  listPosp: (params) =>
    fetchPaginated<Posp>("/api/posp", params),

  /** Lightweight POSP roster for dropdowns (first 100) */
  getState: () =>
    Promise.all([
      fetchPaginated<Posp>("/api/posp", new URLSearchParams({ pageSize: "100", page: "1" })),
      fetchPaginated<Deal>("/api/deals", new URLSearchParams({ pageSize: "100", page: "1" })),
    ]).then(([pospRes, dealsRes]) => ({
      posp: pospRes.data,
      deals: dealsRes.data.map((d) => normalizeDeal(d as unknown as Record<string, unknown>)),
    })),

  createDeal: (input) =>
    request<Record<string, unknown>>("/api/deals", { method: "POST", body: JSON.stringify(input) })
      .then(normalizeDeal),

  updateDeal: (id, input) => {
    const { id: _dealId, ...body } = input;
    return request<Record<string, unknown>>(`/api/deals/${id}`, { method: "PATCH", body: JSON.stringify(body) })
      .then(normalizeDeal);
  },

  deleteDeal: (id) => request<void>(`/api/deals/${id}`, { method: "DELETE" }),

  createPosp: (input) =>
    request<Posp>("/api/posp", { method: "POST", body: JSON.stringify(input) }),

  updatePosp: (id, input) => {
    const { id: _pospId, ...body } = input;
    return request<Posp>(`/api/posp/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  },

  exportDealsCsv: (params?: URLSearchParams) => {
    const qs = params?.toString();
    const path = qs ? `/api/deals/export?${qs}` : "/api/deals/export";
    // Relative URL in the browser — ALB routes /api/* → backend.
    // Absolute URL server-side (SSR) via NEXT_PUBLIC_API_URL or localhost fallback.
    const base =
      typeof window !== "undefined"
        ? ""
        : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000");
    return fetch(`${base}${path}`, {
      credentials: "include",
    }).then((r) => {
      if (!r.ok) throw new Error("Export failed");
      return r.text();
    });
  },
};

export type { PaginatedResponse };
