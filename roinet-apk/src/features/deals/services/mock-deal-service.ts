import AsyncStorage from '@react-native-async-storage/async-storage';

import { CRM_STATE_KEY } from '@/core/constants';
import { SEED } from '@/shared/data/seed';
import type { CrmState, Deal, DealInput, Posp, PospInput } from '@/shared/types/crm.types';

function cloneSeed(): CrmState {
  return JSON.parse(JSON.stringify(SEED)) as CrmState;
}

let state: CrmState | null = null;
let hydratePromise: Promise<void> | null = null;

async function ensureHydrated(): Promise<void> {
  if (state !== null) {
    return;
  }
  if (!hydratePromise) {
    hydratePromise = (async () => {
      try {
        const raw = await AsyncStorage.getItem(CRM_STATE_KEY);
        state = raw ? (JSON.parse(raw) as CrmState) : cloneSeed();
      } catch {
        state = cloneSeed();
      }
    })();
  }
  await hydratePromise;
}

async function persist(): Promise<void> {
  if (!state) {
    return;
  }
  await AsyncStorage.setItem(CRM_STATE_KEY, JSON.stringify(state));
}

function uid(): string {
  return 'id_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
}

export async function getCrmState(): Promise<CrmState> {
  await ensureHydrated();
  return JSON.parse(JSON.stringify(state)) as CrmState;
}

export async function createDeal(input: DealInput): Promise<Deal> {
  await ensureHydrated();
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
    issued: input.issued || null,
    remarks: input.remarks ?? '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  state?.deals.push(deal);
  await persist();
  return { ...deal };
}

export async function updateDeal(id: string, input: DealInput): Promise<Deal> {
  await ensureHydrated();
  const idx = state?.deals.findIndex((d) => d.id === id) ?? -1;
  if (idx < 0 || !state) {
    throw new Error('Deal not found');
  }
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
    issued: input.issued || null,
    remarks: input.remarks ?? '',
    createdAt: state.deals[idx].createdAt,
    updatedAt: new Date().toISOString(),
  };
  state.deals[idx] = deal;
  await persist();
  return { ...deal };
}

export async function deleteDeal(id: string): Promise<void> {
  await ensureHydrated();
  if (!state) {
    return;
  }
  state.deals = state.deals.filter((d) => d.id !== id);
  await persist();
}

export async function createPosp(input: PospInput): Promise<Posp> {
  await ensureHydrated();
  const posp: Posp = {
    id: input.id ?? uid(),
    name: input.name,
    code: input.code,
    mobile: input.mobile ?? '',
    email: input.email ?? '',
    joined: input.joined ?? '',
    active: input.active ?? true,
  };
  state?.posp.push(posp);
  await persist();
  return { ...posp };
}

export async function updatePosp(id: string, input: PospInput): Promise<Posp> {
  await ensureHydrated();
  const idx = state?.posp.findIndex((p) => p.id === id) ?? -1;
  if (idx < 0 || !state) {
    throw new Error('POSP not found');
  }
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
  await persist();
  return { ...posp };
}

export async function exportDealsCsv(): Promise<string> {
  await ensureHydrated();
  const headers = [
    'Customer',
    'Policy',
    'Premium',
    'COA',
    'Margin',
    'Status',
    'Expected',
    'Proposal',
    'PolicyNo',
    'Issued',
  ];
  const rows =
    state?.deals.map((d) => [
      d.customer,
      d.policy,
      d.premium,
      d.coa,
      d.margin,
      d.status,
      d.expected,
      d.proposal,
      d.policyNo,
      d.issued ?? '',
    ]) ?? [];
  return [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
}
