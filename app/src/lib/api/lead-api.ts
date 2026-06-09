/** Lead API client — uses HttpOnly cookie session */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL_SENT' | 'WON' | 'LOST';
export type LeadProduct = 'LIFE' | 'HEALTH' | 'MOTOR';
export type ClosureTimeline = 'THIS_MONTH' | 'T_PLUS_1' | 'T_PLUS_2' | 'LATER';

export interface Lead {
  id: string;
  customerId: string;
  customer?: { id: string; name: string; mobile: string };
  assignedToId?: string;
  assignedTo?: { id: string; name: string; designation: string };
  product: LeadProduct;
  estimatedPremium: number;
  estimatedSum?: number;
  closureTimeline: ClosureTimeline;
  expectedCloseDate?: string;
  status: LeadStatus;
  source?: string;
  remarks?: string;
  convertedToDealId?: string;
  convertedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadInput {
  customerId: string;
  assignedToId?: string;
  product: LeadProduct;
  estimatedPremium: number;
  estimatedSum?: number;
  closureTimeline: ClosureTimeline;
  expectedCloseDate?: string;
  source?: string;
  remarks?: string;
}

export type UpdateLeadInput = Partial<CreateLeadInput> & { status?: LeadStatus };

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

export const leadApi = {
  getAll(): Promise<Lead[]> {
    return apiFetch(`${API_BASE}/api/leads`);
  },
  getMonthlyCommitment(): Promise<{ total: number; count: number }> {
    return apiFetch(`${API_BASE}/api/leads/commitment`);
  },
  create(data: CreateLeadInput): Promise<Lead> {
    return apiFetch(`${API_BASE}/api/leads`, { method: 'POST', body: JSON.stringify(data) });
  },
  update(id: string, data: UpdateLeadInput): Promise<Lead> {
    return apiFetch(`${API_BASE}/api/leads/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },
  convertToDeal(id: string): Promise<{ dealId: string }> {
    return apiFetch(`${API_BASE}/api/leads/${id}/convert`, { method: 'POST' });
  },
};
