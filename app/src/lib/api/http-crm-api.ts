import type { CrmApi } from "./crm-api";
import type { Deal, Posp } from "../types";
import type { PaginatedResponse } from "./pagination-types";
import { fetchPaginated, request } from "./fetch-client";

export const httpCrmApi: CrmApi = {
  listDeals: (params) =>
    fetchPaginated<Deal>("/api/deals", params),

  listPosp: (params) =>
    fetchPaginated<Posp>("/api/posp", params),

  /** Lightweight POSP roster for dropdowns (first 100) */
  getState: () =>
    Promise.all([
      fetchPaginated<Posp>("/api/posp", new URLSearchParams({ pageSize: "100", page: "1" })),
      fetchPaginated<Deal>("/api/deals", new URLSearchParams({ pageSize: "100", page: "1" })),
    ]).then(([pospRes, dealsRes]) => ({
      posp: pospRes.data,
      deals: dealsRes.data,
    })),

  createDeal: (input) =>
    request<Deal>("/api/deals", { method: "POST", body: JSON.stringify(input) }),

  updateDeal: (id, input) => {
    const { id: _dealId, ...body } = input;
    return request<Deal>(`/api/deals/${id}`, { method: "PATCH", body: JSON.stringify(body) });
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
    return fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}${path}`, {
      credentials: "include",
    }).then((r) => {
      if (!r.ok) throw new Error("Export failed");
      return r.text();
    });
  },
};

export type { PaginatedResponse };
