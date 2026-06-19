import { CRM_STATE_KEY } from '@/core/constants';
import { SEED } from '@/shared/data/seed';
import {
  getSessionItem,
  setSessionItem,
} from '@/shared/services/session-storage';
import type {
  BulletinInput,
  BulletinPost,
  CrmState,
  Deal,
  DealInput,
  Posp,
  PospInput,
} from '@/shared/types/crm.types';
import { migrateCrmState, nextLeadNo } from '@/shared/utils/crm-migrate';

function cloneSeed(): CrmState {
  return migrateCrmState(SEED);
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
        const raw = await getSessionItem(CRM_STATE_KEY);
        state = raw ? migrateCrmState(JSON.parse(raw) as Partial<CrmState>) : cloneSeed();
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
  await setSessionItem(CRM_STATE_KEY, JSON.stringify(state));
}

function uid(): string {
  return 'id_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildDeal(input: DealInput, existing?: Deal): Deal {
  const now = new Date().toISOString();
  const stage = input.stage ?? (input.policyNo ? 'issued' : 'open');
  return {
    id: input.id ?? existing?.id ?? uid(),
    leadNo: input.leadNo ?? existing?.leadNo ?? '',
    pospId: input.pospId,
    customer: input.customer,
    policy: input.policy,
    sum: input.sum ?? 0,
    premium: input.premium ?? 0,
    coa: input.coa ?? 0,
    margin: input.margin ?? 0,
    brokerage: input.brokerage ?? 0,
    status: input.status,
    stage,
    lastUpdated: input.lastUpdated ?? todayIso(),
    expected: input.expected ?? '',
    proposal: input.proposal ?? '',
    policyNo: input.policyNo ?? '',
    issued: input.issued || null,
    insurer: input.insurer ?? '',
    remarks: input.remarks ?? '',
    createdAt: existing?.createdAt ?? input.createdAt ?? now,
    updatedAt: now,
  };
}

function buildPosp(input: PospInput, existing?: Posp): Posp {
  return {
    id: input.id ?? existing?.id ?? uid(),
    name: input.name,
    code: input.code,
    mobile: input.mobile ?? '',
    email: input.email ?? '',
    joined: input.joined ?? '',
    active: input.active ?? true,
    region: input.region ?? existing?.region ?? '',
    area: input.area ?? existing?.area ?? '',
    asm: input.asm ?? existing?.asm ?? '',
    rm: input.rm ?? existing?.rm ?? '',
  };
}

export async function getCrmState(): Promise<CrmState> {
  await ensureHydrated();
  return JSON.parse(JSON.stringify(state)) as CrmState;
}

export async function createDeal(input: DealInput): Promise<Deal> {
  await ensureHydrated();
  if (!state) {
    throw new Error('CRM state not loaded');
  }
  const deal = buildDeal({
    ...input,
    leadNo: input.leadNo || nextLeadNo(state.deals),
  });
  state.deals.push(deal);
  await persist();
  return { ...deal };
}

export async function updateDeal(id: string, input: DealInput): Promise<Deal> {
  await ensureHydrated();
  const idx = state?.deals.findIndex((d) => d.id === id) ?? -1;
  if (idx < 0 || !state) {
    throw new Error('Deal not found');
  }
  const deal = buildDeal({ ...input, id }, state.deals[idx]);
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
  if (!state) {
    throw new Error('CRM state not loaded');
  }
  const posp = buildPosp(input);
  state.posp.push(posp);
  await persist();
  return { ...posp };
}

export async function updatePosp(id: string, input: PospInput): Promise<Posp> {
  await ensureHydrated();
  const idx = state?.posp.findIndex((p) => p.id === id) ?? -1;
  if (idx < 0 || !state) {
    throw new Error('POSP not found');
  }
  const posp = buildPosp(input, state.posp[idx]);
  state.posp[idx] = posp;
  await persist();
  return { ...posp };
}

export async function addBulletinPost(input: BulletinInput): Promise<BulletinPost> {
  await ensureHydrated();
  if (!state) {
    throw new Error('CRM state not loaded');
  }
  const post: BulletinPost = {
    id: input.id ?? uid(),
    date: input.date || todayIso(),
    author: input.author,
    text: input.text,
  };
  state.bulletin.unshift(post);
  await persist();
  return { ...post };
}

export async function deleteBulletinPost(id: string): Promise<void> {
  await ensureHydrated();
  if (!state) {
    return;
  }
  state.bulletin = state.bulletin.filter((b) => b.id !== id);
  await persist();
}

export async function exportDealsCsv(): Promise<string> {
  await ensureHydrated();
  const headers = [
    'LeadNo',
    'Customer',
    'Policy',
    'Premium',
    'Brokerage',
    'COA',
    'Margin',
    'Status',
    'Stage',
    'Expected',
    'Proposal',
    'PolicyNo',
    'Issued',
    'Insurer',
  ];
  const rows =
    state?.deals.map((d) => [
      d.leadNo,
      d.customer,
      d.policy,
      d.premium,
      d.brokerage,
      d.coa,
      d.margin,
      d.status,
      d.stage,
      d.expected,
      d.proposal,
      d.policyNo,
      d.issued ?? '',
      d.insurer,
    ]) ?? [];
  return [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
}
