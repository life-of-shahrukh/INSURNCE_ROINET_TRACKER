import { CRM_SESSION_DATE } from '@/core/constants';
import { STAGE_CONFIG, STALLED_DAYS } from '@/core/constants/crm-config';
import type {
  Deal,
  DealStage,
  Manager,
  Posp,
  RecruitmentTargets,
  StrategicAccount,
} from '@/shared/types/crm.types';

export function pospName(posp: Posp[], id: string): string {
  const p = posp.find((x) => x.id === id);
  return p ? p.name : '–';
}

export function stageInfo(stage: DealStage): { label: string; prob: number } {
  return STAGE_CONFIG[stage] ?? STAGE_CONFIG.open;
}

export function weightedValue(deal: Deal): number {
  return (+deal.premium || 0) * stageInfo(deal.stage).prob;
}

export type TimeBandKey = 'week' | 'month' | 'quarter' | 'later' | 'closed';

export interface TimeBandInfo {
  key: TimeBandKey;
  label: string;
}

export function timeBand(deal: Deal, today = CRM_SESSION_DATE): TimeBandInfo {
  if (deal.stage === 'issued') {
    return { key: 'closed', label: 'Issued' };
  }
  if (deal.stage === 'lost') {
    return { key: 'closed', label: 'Lost' };
  }
  const exp = deal.expected ? new Date(deal.expected) : today;
  const days = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 7) {
    return { key: 'week', label: 'This Week' };
  }
  if (days <= 31) {
    return { key: 'month', label: 'This Month' };
  }
  if (days <= 92) {
    return { key: 'quarter', label: 'This Quarter' };
  }
  return { key: 'later', label: 'Later' };
}

export function isStalled(deal: Deal, today = CRM_SESSION_DATE): boolean {
  if (deal.stage === 'issued' || deal.stage === 'lost') {
    return false;
  }
  if (!deal.lastUpdated) {
    return false;
  }
  const days = Math.ceil((today.getTime() - new Date(deal.lastUpdated).getTime()) / (1000 * 60 * 60 * 24));
  return days >= STALLED_DAYS;
}

export function isPospActive(pospItem: Posp, deals: Deal[], today = CRM_SESSION_DATE): boolean {
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const cutoff = new Date(monthStart);
  cutoff.setDate(cutoff.getDate() - 60);
  return deals.some(
    (d) =>
      d.pospId === pospItem.id &&
      d.stage === 'issued' &&
      d.issued &&
      new Date(d.issued) >= cutoff,
  );
}

function currentMonthKey(today = CRM_SESSION_DATE): string {
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
}

export interface DashboardKpis {
  monthPremium: number;
  monthName: string;
  totalBrokerage: number;
  totalMargin: number;
  weightedPipeline: number;
  openDealCount: number;
  activePosps: number;
  totalPosps: number;
  hotDeals: number;
  issued: number;
  conv: number;
  dealCount: number;
}

export function computeDashboardKpis(deals: Deal[], posp: Posp[], today = CRM_SESSION_DATE): DashboardKpis {
  const curMonth = currentMonthKey(today);
  const monthName = today.toLocaleString('en-IN', { month: 'long' });
  const monthPremium = deals
    .filter((d) => d.stage === 'issued' && (d.issued || '').slice(0, 7) === curMonth)
    .reduce((a, d) => a + (+d.premium || 0), 0);
  const totalMargin = deals.reduce((a, d) => a + (+d.margin || 0), 0);
  const totalBrokerage = deals.reduce((a, d) => a + (+d.brokerage || 0), 0);
  const openDeals = deals.filter((d) => d.stage !== 'issued' && d.stage !== 'lost');
  const weightedPipeline = openDeals.reduce((a, d) => a + weightedValue(d), 0);
  const activePosps = posp.filter((p) => isPospActive(p, deals, today)).length;
  const hotDeals = deals.filter((d) => d.status === 'H').length;
  const issued = deals.filter((d) => d.stage === 'issued').length;
  const conv = deals.length ? Math.round((issued / deals.length) * 100) : 0;

  return {
    monthPremium,
    monthName,
    totalBrokerage,
    totalMargin,
    weightedPipeline,
    openDealCount: openDeals.length,
    activePosps,
    totalPosps: posp.length,
    hotDeals,
    issued,
    conv,
    dealCount: deals.length,
  };
}

export interface RenewalRow extends Deal {
  renew: Date;
  daysLeft: number;
}

export function computeRenewals(deals: Deal[], today = CRM_SESSION_DATE): RenewalRow[] {
  return deals
    .filter((d) => d.issued)
    .map((d) => {
      const renew = new Date(d.issued as string);
      renew.setFullYear(renew.getFullYear() + 1);
      const daysLeft = Math.ceil((renew.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { ...d, renew, daysLeft };
    })
    .filter((d) => d.daysLeft <= 90 && d.daysLeft >= -30)
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

export interface CommissionRow {
  posp: Posp;
  premium: number;
  coa: number;
  margin: number;
  dealCount: number;
  issued: number;
}

export function computeCommissions(deals: Deal[], posp: Posp[]): CommissionRow[] {
  return posp
    .map((p) => {
      const myDeals = deals.filter((d) => d.pospId === p.id);
      const premium = myDeals.reduce((a, d) => a + (+d.premium || 0), 0);
      const coa = myDeals.reduce((a, d) => a + (+d.coa || 0), 0);
      const margin = myDeals.reduce((a, d) => a + (+d.margin || 0), 0);
      const issued = myDeals.filter((d) => d.policyNo).length;
      return { posp: p, premium, coa, margin, dealCount: myDeals.length, issued };
    })
    .sort((a, b) => b.premium - a.premium);
}

export interface PolicySummaryRow {
  policy: string;
  count: number;
  premium: number;
  brokerage: number;
  coa: number;
  margin: number;
}

export function computePolicySummary(deals: Deal[]): PolicySummaryRow[] {
  const policySums: Record<string, PolicySummaryRow> = {};
  deals.forEach((d) => {
    if (!policySums[d.policy]) {
      policySums[d.policy] = { policy: d.policy, count: 0, premium: 0, brokerage: 0, coa: 0, margin: 0 };
    }
    policySums[d.policy].count++;
    policySums[d.policy].premium += +d.premium || 0;
    policySums[d.policy].brokerage += +d.brokerage || 0;
    policySums[d.policy].coa += +d.coa || 0;
    policySums[d.policy].margin += +d.margin || 0;
  });
  return Object.values(policySums).sort((a, b) => b.premium - a.premium);
}

export interface PremiumBandRow {
  label: string;
  count: number;
}

export const PREMIUM_HIST_BANDS = [
  { label: '₹0', min: 0, max: 0 },
  { label: '1–5K', min: 1, max: 5000 },
  { label: '5–15K', min: 5001, max: 15000 },
  { label: '15–30K', min: 15001, max: 30000 },
  { label: '30–50K', min: 30001, max: 50000 },
  { label: '50K+', min: 50001, max: Number.MAX_SAFE_INTEGER },
] as const;

export function computePremiumBands(deals: Deal[]): PremiumBandRow[] {
  return PREMIUM_HIST_BANDS.map((band) => ({
    label: band.label,
    count: deals.filter((d) => {
      const p = +d.premium || 0;
      return p >= band.min && p <= band.max;
    }).length,
  }));
}

export interface TimeBandPremiumRow {
  key: TimeBandKey;
  label: string;
  premium: number;
  color: string;
}

export function computeTimeBandPremiums(deals: Deal[]): TimeBandPremiumRow[] {
  const order: Array<{ key: TimeBandKey; label: string; color: string }> = [
    { key: 'week', label: 'This Week', color: '#f4a261' },
    { key: 'month', label: 'This Month', color: '#e9c46a' },
    { key: 'quarter', label: 'This Quarter', color: '#3282b8' },
    { key: 'later', label: 'Later', color: '#6c8bb8' },
  ];
  const openDeals = deals.filter((d) => d.stage !== 'issued' && d.stage !== 'lost');
  const totals: Partial<Record<TimeBandKey, number>> = {};
  openDeals.forEach((d) => {
    const band = timeBand(d);
    if (band.key !== 'closed') {
      totals[band.key] = (totals[band.key] || 0) + (+d.premium || 0);
    }
  });
  return order.map((item) => ({
    ...item,
    premium: totals[item.key] || 0,
  }));
}

export function computeOpenPipelineByPolicy(deals: Deal[]): Array<{ label: string; value: number }> {
  const openByPolicy: Record<string, number> = {};
  deals
    .filter((d) => d.stage === 'open')
    .forEach((d) => {
      openByPolicy[d.policy] = (openByPolicy[d.policy] || 0) + (+d.premium || 0);
    });
  return Object.entries(openByPolicy)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export type PospCoverageSlice = 'national' | 'region' | 'asm';

export interface PospCoverageRow {
  key: string;
  total: number;
  active: number;
  inactive: number;
  newThisMonth: number;
  pct: number;
  deals: number;
  premium: number;
  brokerage: number;
}

export function computePospCoverage(
  deals: Deal[],
  posp: Posp[],
  slice: PospCoverageSlice,
  today = CRM_SESSION_DATE,
): PospCoverageRow[] {
  const curMonth = currentMonthKey(today);
  let groups: Array<{ key: string; members: Posp[] }>;

  if (slice === 'national') {
    groups = [{ key: 'All India', members: posp }];
  } else {
    const field = slice === 'region' ? 'region' : 'asm';
    const map: Record<string, Posp[]> = {};
    posp.forEach((p) => {
      const k = p[field] || 'Unassigned';
      if (!map[k]) {
        map[k] = [];
      }
      map[k].push(p);
    });
    groups = Object.keys(map)
      .sort()
      .map((k) => ({ key: k, members: map[k] }));
  }

  return groups.map((g) => {
    const total = g.members.length;
    const active = g.members.filter((p) => isPospActive(p, deals, today)).length;
    const newThisMonth = g.members.filter((p) => (p.joined || '').slice(0, 7) === curMonth).length;
    const ids = g.members.map((p) => p.id);
    const myDeals = deals.filter((d) => ids.includes(d.pospId));
    const premium = myDeals.reduce((a, d) => a + (+d.premium || 0), 0);
    const brokerage = myDeals.reduce((a, d) => a + (+d.brokerage || 0), 0);
    return {
      key: g.key,
      total,
      active,
      inactive: total - active,
      newThisMonth,
      pct: total ? Math.round((active / total) * 100) : 0,
      deals: myDeals.length,
      premium,
      brokerage,
    };
  });
}

export type PgmGroupBy = 'national' | 'asm';

export interface PgmRow {
  name: string;
  premium: number;
  brokerage: number;
  margin: number;
  deals: number;
  marginPct: string;
}

export function computePgmRows(
  deals: Deal[],
  posp: Posp[],
  managers: Manager[],
  groupBy: PgmGroupBy,
): PgmRow[] {
  const groups: Record<string, { premium: number; brokerage: number; margin: number; deals: number }> = {};

  if (groupBy === 'national') {
    const natMgr = managers.find((m) => m.title === 'National Head');
    const natName = natMgr ? natMgr.name : 'National Head';
    groups[natName] = { premium: 0, brokerage: 0, margin: 0, deals: 0 };
    deals.forEach((d) => {
      groups[natName].premium += +d.premium || 0;
      groups[natName].brokerage += +d.brokerage || 0;
      groups[natName].margin += +d.margin || 0;
      groups[natName].deals++;
    });
  } else {
    deals.forEach((d) => {
      const p = posp.find((x) => x.id === d.pospId);
      const name = p?.asm || 'Unassigned';
      if (!groups[name]) {
        groups[name] = { premium: 0, brokerage: 0, margin: 0, deals: 0 };
      }
      groups[name].premium += +d.premium || 0;
      groups[name].brokerage += +d.brokerage || 0;
      groups[name].margin += +d.margin || 0;
      groups[name].deals++;
    });
  }

  return Object.entries(groups)
    .map(([name, g]) => ({
      name,
      ...g,
      marginPct: marginPercent(g.margin, g.premium),
    }))
    .sort((a, b) => b.premium - a.premium);
}

export interface TargetRow {
  name: string;
  target: number;
  actual: number;
  pct: number;
  gap: number;
}

export function recruitedThisMonth(
  posp: Posp[],
  field: 'asm' | 'rm',
  today = CRM_SESSION_DATE,
): Record<string, number> {
  const curMonth = currentMonthKey(today);
  const counts: Record<string, number> = {};
  posp.forEach((p) => {
    const mgr = p[field] || 'Unassigned';
    if (!counts[mgr]) {
      counts[mgr] = 0;
    }
    if ((p.joined || '').slice(0, 7) === curMonth) {
      counts[mgr]++;
    }
  });
  return counts;
}

export function buildTargetRows(
  posp: Posp[],
  targetMap: RecruitmentTargets['asm'],
  today = CRM_SESSION_DATE,
): TargetRow[] {
  const actuals = recruitedThisMonth(posp, 'asm', today);
  const names = [...new Set([...Object.keys(targetMap), ...Object.keys(actuals)])].sort();
  return names.map((name) => {
    const target = +targetMap[name] || 0;
    const actual = actuals[name] || 0;
    const pct = target ? Math.round((actual / target) * 100) : actual ? 100 : 0;
    return { name, target, actual, pct, gap: actual - target };
  });
}

export function isUpdateStale(dateStr: string, today = CRM_SESSION_DATE): boolean {
  if (!dateStr) {
    return true;
  }
  const days = Math.ceil((today.getTime() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  return days > 7;
}

export function strategicByBand(accounts: StrategicAccount[]): Record<string, StrategicAccount[]> {
  const bands = ['week', 'month', 'quarter'] as const;
  const result: Record<string, StrategicAccount[]> = {};
  bands.forEach((band) => {
    result[band] = accounts.filter((a) => a.band === band);
  });
  return result;
}

export function marginPercent(margin: number, premium: number): string {
  if (!premium) {
    return '–';
  }
  return `${((margin / premium) * 100).toFixed(1)}%`;
}
