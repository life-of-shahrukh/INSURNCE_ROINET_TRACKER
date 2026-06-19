import { INSURERS, STRATEGIC_SOURCES } from '@/core/constants/crm-config';
import { SEED } from '@/shared/data/seed';
import type { CrmState, Deal } from '@/shared/types/crm.types';

function nextLeadCounter(deals: Deal[]): number {
  let counter = 22300;
  deals.forEach((deal) => {
    const match = /^LD-(\d+)$/.exec(deal.leadNo || '');
    if (match) {
      counter = Math.max(counter, parseInt(match[1], 10));
    }
  });
  return counter;
}

export function migrateCrmState(input: Partial<CrmState> | null | undefined): CrmState {
  const base = JSON.parse(JSON.stringify(SEED)) as CrmState;
  const state: CrmState = {
    posp: input?.posp ?? base.posp,
    deals: input?.deals ?? base.deals,
    managers: input?.managers ?? base.managers,
    targets: input?.targets ?? base.targets,
    visits: input?.visits ?? base.visits,
    strategic: input?.strategic ?? base.strategic,
    quotes: input?.quotes ?? base.quotes,
    bulletin: input?.bulletin ?? base.bulletin,
  };

  let leadCounter = nextLeadCounter(state.deals);

  state.deals = state.deals.map((deal, index) => {
    const migrated: Deal = { ...deal };
    if (!migrated.leadNo) {
      leadCounter += 1;
      migrated.leadNo = `LD-${leadCounter}`;
    }
    if (migrated.brokerage == null) {
      migrated.brokerage = 0;
    }
    if (!migrated.insurer) {
      migrated.insurer = '';
    }
    if (!migrated.stage) {
      migrated.stage = migrated.policyNo ? 'issued' : 'open';
    }
    if (!migrated.lastUpdated) {
      migrated.lastUpdated = migrated.expected || migrated.updatedAt || '2026-05-01';
    }
    if (migrated.stage === 'issued' && !migrated.insurer) {
      migrated.insurer = INSURERS[index % INSURERS.length];
    }
    return migrated;
  });

  state.posp = state.posp.map((posp) => ({
    ...posp,
    region: posp.region ?? '',
    area: posp.area ?? '',
    asm: posp.asm ?? '',
    rm: posp.rm ?? '',
  }));

  state.targets = state.targets ?? { asm: {} };
  state.targets.asm = state.targets.asm ?? {};
  state.managers = state.managers ?? [];
  state.visits = state.visits ?? [];
  state.strategic = state.strategic ?? [];
  state.quotes = state.quotes ?? [];
  state.bulletin = state.bulletin ?? [];

  state.strategic = state.strategic.map((account, index) => ({
    ...account,
    source: account.source ?? STRATEGIC_SOURCES[index % STRATEGIC_SOURCES.length],
  }));

  return state;
}

export function nextLeadNo(deals: Deal[]): string {
  let max = 22300;
  deals.forEach((deal) => {
    const match = /^LD-(\d+)$/.exec(deal.leadNo || '');
    if (match) {
      max = Math.max(max, parseInt(match[1], 10));
    }
  });
  return `LD-${max + 1}`;
}
