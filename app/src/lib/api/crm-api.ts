import type { CrmState, Deal, DealInput, Posp, PospInput } from "../types";

export interface CrmApi {
  getState(): Promise<CrmState>;
  createDeal(input: DealInput): Promise<Deal>;
  updateDeal(id: string, input: DealInput): Promise<Deal>;
  deleteDeal(id: string): Promise<void>;
  createPosp(input: PospInput): Promise<Posp>;
  updatePosp(id: string, input: PospInput): Promise<Posp>;
  exportDealsCsv(): Promise<string>;
}
