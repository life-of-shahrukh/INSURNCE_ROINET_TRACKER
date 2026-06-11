import type { PaginatedResponse } from './pagination-types';
import { fetchPaginated, request } from './fetch-client';

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

export const leadApi = {
  getAll(params?: URLSearchParams): Promise<PaginatedResponse<Lead>> {
    return fetchPaginated<Lead>('/api/leads', params);
  },

  getMonthlyCommitment(): Promise<{ total: number; count: number }> {
    return request<{ total: number; count: number }>('/api/leads/commitment');
  },

  create(data: CreateLeadInput): Promise<Lead> {
    return request<Lead>('/api/leads', { method: 'POST', body: JSON.stringify(data) });
  },

  update(id: string, data: UpdateLeadInput): Promise<Lead> {
    return request<Lead>(`/api/leads/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },

  convertToDeal(id: string): Promise<{ dealId: string }> {
    return request<{ dealId: string }>(`/api/leads/${id}/convert`, { method: 'POST' });
  },
};
