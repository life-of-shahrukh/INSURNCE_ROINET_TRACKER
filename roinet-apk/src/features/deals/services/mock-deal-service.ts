import { SEED } from '@/shared/data/seed';
import type { CrmState, Deal, DealInput, Posp, PospInput } from '@/shared/types/crm.types';

function cloneState(): CrmState {
  return JSON.parse(JSON.stringify(SEED)) as CrmState;
}

let state: CrmState = cloneState();

function uid(): string {
  return 'id_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
}

export async function getCrmState(): Promise<CrmState> {
  return JSON.parse(JSON.stringify(state)) as CrmState;
}

export async function createDeal(input: DealInput): Promise<Deal> {
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
    expected: input.expected ?? '',
    proposal: input.proposal ?? '',
    policyNo: input.policyNo ?? '',
    issued: input.issued ?? null,
    remarks: input.remarks ?? '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  state.deals.push(deal);
  return { ...deal };
}

export async function updateDeal(id: string, input: DealInput): Promise<Deal> {
  const idx = state.deals.findIndex((d) => d.id === id);
  if (idx < 0) throw new Error('Deal not found');
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
    expected: input.expected ?? '',
    proposal: input.proposal ?? '',
    policyNo: input.policyNo ?? '',
    issued: input.issued ?? null,
    remarks: input.remarks ?? '',
    createdAt: state.deals[idx].createdAt,
    updatedAt: new Date().toISOString(),
  };
  state.deals[idx] = deal;
  return { ...deal };
}

export async function deleteDeal(id: string): Promise<void> {
  state.deals = state.deals.filter((d) => d.id !== id);
}

export async function createPosp(input: PospInput): Promise<Posp> {
  const posp: Posp = {
    id: input.id ?? uid(),
    name: input.name,
    code: input.code,
    mobile: input.mobile ?? '',
    email: input.email ?? '',
    joined: input.joined ?? '',
    active: input.active ?? true,
  };
  state.posp.push(posp);
  return { ...posp };
}

export async function updatePosp(id: string, input: PospInput): Promise<Posp> {
  const idx = state.posp.findIndex((p) => p.id === id);
  if (idx < 0) throw new Error('POSP not found');
  const posp: Posp = {
    id,
    name: input.name,
    code: input.code,
    mobile: input.mobile ?? '',
    email: input.email ?? '',
    joined: input.joined ?? '',
    active: input.active ?? true,
  };
  state.posp[idx] = posp;
  return { ...posp };
}

export async function exportDealsCsv(): Promise<string> {
  const headers = ['Customer', 'Policy', 'Premium', 'Status'];
  const rows = state.deals.map((d) => [d.customer, d.policy, d.premium, d.status]);
  return [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
}
