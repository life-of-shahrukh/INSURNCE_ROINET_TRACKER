import { request } from "./fetch-client";

export interface CommissionRecord {
  lob: string;
  insurer: string;
  product: string;
  variant: string;
  rates: Record<string, number | null> & { _statewise?: Record<string, number | null> };
  remark: string;
}

export interface CommissionMeta {
  lobs: Array<{ name: string; count: number }>;
  insurers: string[];
  states: Array<{ stateId: string; stateName: string; stateCode: string }>;
  zones: Array<{ zoneId: string; zoneName: string }>;
  lastUpdated: string | null;
}

export interface CommissionSearchParams {
  lob?: string;
  insurer?: string;
  state?: string;
  query?: string;
}

export interface PayoutGridConfigRecord {
  id: string;
  scopeType: string;
  scopeValue: string;
  insurerSlug: string | null;
  visible: boolean;
  restrictions: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PayoutGridConfigResponse {
  configs: PayoutGridConfigRecord[];
  insurers: string[];
}

export function fetchCommissionMeta(): Promise<CommissionMeta> {
  return request<CommissionMeta>("/api/payout-grids/meta");
}

export function searchCommissions(
  params: CommissionSearchParams,
): Promise<CommissionRecord[]> {
  const qs = new URLSearchParams();
  if (params.lob) qs.set("lob", params.lob);
  if (params.insurer) qs.set("insurer", params.insurer);
  if (params.state) qs.set("state", params.state);
  if (params.query) qs.set("query", params.query);
  const path = `/api/payout-grids/search${qs.toString() ? `?${qs}` : ""}`;
  return request<CommissionRecord[]>(path);
}

export function fetchPayoutGridConfig(): Promise<PayoutGridConfigResponse> {
  return request<PayoutGridConfigResponse>("/api/payout-grid-config");
}

export function upsertPayoutGridConfig(data: {
  scopeType: string;
  scopeValue: string;
  insurerSlug?: string;
  visible: boolean;
  restrictions?: string;
}): Promise<PayoutGridConfigRecord> {
  return request<PayoutGridConfigRecord>("/api/payout-grid-config", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deletePayoutGridConfig(id: string): Promise<void> {
  return request<void>(`/api/payout-grid-config/${id}`, { method: "DELETE" });
}
