import { buildDealsCsv } from "../crm-calculations";
import { uid } from "../formatters";
import { SEED } from "../seed";
import type { CrmApi } from "./crm-api";
import type { CrmState, Deal, DealInput, Posp, PospInput } from "../types";

function cloneState(): CrmState {
  return JSON.parse(JSON.stringify(SEED)) as CrmState;
}

let state: CrmState = cloneState();

export const mockCrmApi: CrmApi = {
  async getState() {
    return JSON.parse(JSON.stringify(state)) as CrmState;
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
      expected: input.expected ?? "",
      proposal: input.proposal ?? "",
      policyNo: input.policyNo ?? "",
      issued: input.issued ?? "",
      remarks: input.remarks ?? "",
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
      expected: input.expected ?? "",
      proposal: input.proposal ?? "",
      policyNo: input.policyNo ?? "",
      issued: input.issued ?? "",
      remarks: input.remarks ?? "",
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
      joined: input.joined ?? "",
      active: input.active ?? true,
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
      joined: input.joined ?? "",
      active: input.active ?? true,
    };
    state.posp[idx] = posp;
    return { ...posp };
  },

  async exportDealsCsv() {
    return buildDealsCsv(state.deals, state.posp);
  },
};

/** Reset mock state (testing) */
export function resetMockState() {
  state = cloneState();
}
