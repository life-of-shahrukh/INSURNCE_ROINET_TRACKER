import { buildDealsCsv } from "../crm-calculations";
import { uid } from "../formatters";
import { SEED } from "../seed";
import type { CrmApi } from "./crm-api";
import type { PaginatedResponse } from "./pagination-types";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from "./pagination-types";
import { parseListQueryFromSearchParams } from "./list-query-params";
import { filterDealsForListQuery } from "../filters/filter-utils";
import type { CrmState, Deal, Posp } from "../types";

function cloneState(): CrmState {
  return JSON.parse(JSON.stringify(SEED)) as CrmState;
}

function paginate<T>(items: T[], params?: URLSearchParams): PaginatedResponse<T> {
  const page = Math.max(1, Number(params?.get("page")) || DEFAULT_PAGE);
  const pageSize = Math.min(100, Math.max(1, Number(params?.get("pageSize")) || DEFAULT_PAGE_SIZE));
  const search = (params?.get("search") ?? "").trim().toLowerCase();
  let filtered = items;
  if (search) {
    filtered = items.filter((item) =>
      JSON.stringify(item).toLowerCase().includes(search),
    );
  }
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);
  return { data, meta: { page, pageSize, total, totalPages } };
}

function filterDealsFromParams(deals: Deal[], params?: URLSearchParams): Deal[] {
  const query = parseListQueryFromSearchParams(params ?? new URLSearchParams());
  return filterDealsForListQuery(deals, query);
}

let state: CrmState = cloneState();

export const mockCrmApi: CrmApi = {
  async getState() {
    return JSON.parse(JSON.stringify(state)) as CrmState;
  },

  async listDeals(params) {
    const filtered = filterDealsFromParams(state.deals, params);
    return paginate(filtered, params);
  },

  async listPosp(params) {
    return paginate(state.posp, params);
  },

  async createDeal(input) {
    const deal: Deal = {
      id: input.id ?? uid(),
      pospId: input.pospId,
      customer: input.customer,
      policy: input.policy,
      sum: input.sum ?? 0,
      premium: input.premium ?? 0,
      coa: input.coa ?? 0,
      margin: input.margin ?? 0,
      status: input.status,
      expected: new Date(input.expected),
      proposal: input.proposal ?? "",
      policyNo: input.policyNo ?? "",
      issued: input.issued ? new Date(input.issued) : undefined,
      remarks: input.remarks ?? "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    state.deals.push(deal);
    return { ...deal };
  },

  async updateDeal(id, input) {
    const idx = state.deals.findIndex((d) => d.id === id);
    if (idx < 0) throw new Error("Deal not found");
    const deal: Deal = {
      id,
      pospId: input.pospId,
      customer: input.customer,
      policy: input.policy,
      sum: input.sum ?? 0,
      premium: input.premium ?? 0,
      coa: input.coa ?? 0,
      margin: input.margin ?? 0,
      status: input.status,
      expected: new Date(input.expected),
      proposal: input.proposal ?? "",
      policyNo: input.policyNo ?? "",
      issued: input.issued ? new Date(input.issued) : undefined,
      remarks: input.remarks ?? "",
      createdAt: state.deals[idx]?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };
    state.deals[idx] = deal;
    return { ...deal };
  },

  async deleteDeal(id) {
    state.deals = state.deals.filter((d) => d.id !== id);
  },

  async createPosp(input) {
    const posp: Posp = {
      id: input.id ?? uid(),
      name: input.name,
      code: input.code,
      mobile: input.mobile ?? "",
      email: input.email ?? "",
      joined: new Date(input.joined),
      active: input.active ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    state.posp.push(posp);
    return { ...posp };
  },

  async updatePosp(id, input) {
    const idx = state.posp.findIndex((p) => p.id === id);
    if (idx < 0) throw new Error("POSP not found");
    const posp: Posp = {
      id,
      name: input.name,
      code: input.code,
      mobile: input.mobile ?? "",
      email: input.email ?? "",
      joined: new Date(input.joined),
      active: input.active ?? true,
      createdAt: state.posp[idx]?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };
    state.posp[idx] = posp;
    return { ...posp };
  },

  async exportDealsCsv(params) {
    const { data } = await mockCrmApi.listDeals(params);
    return buildDealsCsv(data, state.posp);
  },
};

/** Reset mock state (testing) */
export function resetMockState() {
  state = cloneState();
}
