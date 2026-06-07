import { getToken, request } from '@/shared/services/api-client';
import type { CrmState, Deal, DealInput, Posp, PospInput } from '@/shared/types/crm.types';
import { API_BASE_URL } from '@/core/constants';

export async function getCrmState(): Promise<CrmState> {
  const [posp, deals] = await Promise.all([
    request<Posp[]>('/api/posp'),
    request<Deal[]>('/api/deals'),
  ]);
  return { posp, deals };
}

export async function createDeal(input: DealInput): Promise<Deal> {
  return request<Deal>('/api/deals', { method: 'POST', body: JSON.stringify(input) });
}

export async function updateDeal(id: string, input: DealInput): Promise<Deal> {
  const { id: _id, createdAt: _c, updatedAt: _u, ...body } = input;
  return request<Deal>(`/api/deals/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export async function deleteDeal(id: string): Promise<void> {
  return request<void>(`/api/deals/${id}`, { method: 'DELETE' });
}

export async function createPosp(input: PospInput): Promise<Posp> {
  return request<Posp>('/api/posp', { method: 'POST', body: JSON.stringify(input) });
}

export async function updatePosp(id: string, input: PospInput): Promise<Posp> {
  const { id: _id, ...body } = input;
  return request<Posp>(`/api/posp/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export async function exportDealsCsv(): Promise<string> {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}/api/deals/export`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Export failed');
  return res.text();
}
