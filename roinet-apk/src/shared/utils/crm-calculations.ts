import { CRM_SESSION_DATE } from '@/core/constants';
import type { Deal, Posp } from '@/shared/types/crm.types';

export function pospName(posp: Posp[], id: string): string {
  const p = posp.find((x) => x.id === id);
  return p ? p.name : '–';
}

export interface DashboardKpis {
  totalPremium: number;
  totalMargin: number;
  activePosps: number;
  hotDeals: number;
  issued: number;
  conv: number;
  dealCount: number;
}

export function computeDashboardKpis(deals: Deal[], posp: Posp[]): DashboardKpis {
  const totalPremium = deals.reduce((a, d) => a + (+d.premium || 0), 0);
  const totalMargin = deals.reduce((a, d) => a + (+d.margin || 0), 0);
  const activePosps = posp.filter((p) => p.active).length;
  const hotDeals = deals.filter((d) => d.status === 'H').length;
  const issued = deals.filter((d) => d.policyNo).length;
  const conv = deals.length ? Math.round((issued / deals.length) * 100) : 0;
  return {
    totalPremium,
    totalMargin,
    activePosps,
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
  coa: number;
  margin: number;
}

export function computePolicySummary(deals: Deal[]): PolicySummaryRow[] {
  const policySums: Record<string, PolicySummaryRow> = {};
  deals.forEach((d) => {
    if (!policySums[d.policy]) {
      policySums[d.policy] = { policy: d.policy, count: 0, premium: 0, coa: 0, margin: 0 };
    }
    policySums[d.policy].count++;
    policySums[d.policy].premium += +d.premium || 0;
    policySums[d.policy].coa += +d.coa || 0;
    policySums[d.policy].margin += +d.margin || 0;
  });
  return Object.values(policySums).sort((a, b) => b.premium - a.premium);
}

export function marginPercent(margin: number, premium: number): string {
  if (!premium) {
    return '–';
  }
  return `${((margin / premium) * 100).toFixed(1)}%`;
}
