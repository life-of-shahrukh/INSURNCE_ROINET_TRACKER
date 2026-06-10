import type { CrmState, Deal, DealInput, Posp, PospInput } from "../types";
import type { PaginatedResponse } from "./pagination-types";

export interface CrmApi {
  getState(): Promise<CrmState>;
  listDeals(params?: URLSearchParams): Promise<PaginatedResponse<Deal>>;
  listPosp(params?: URLSearchParams): Promise<PaginatedResponse<Posp>>;
  createDeal(input: DealInput): Promise<Deal>;
  updateDeal(id: string, input: DealInput): Promise<Deal>;
  deleteDeal(id: string): Promise<void>;
  createPosp(input: PospInput): Promise<Posp>;
  updatePosp(id: string, input: PospInput): Promise<Posp>;
  exportDealsCsv(params?: URLSearchParams): Promise<string>;
}
