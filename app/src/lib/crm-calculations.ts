import { CRM_SESSION_DATE } from "./constants";
import type { Deal, Posp } from "./types";
import { formatPospLabel, pospLabelFromParts } from "./posp-display";
import { statusLabel } from "./formatters";

export function pospName(posp: Posp[], id: string | null): string {
  if (!id) return "—";
  const p = posp.find((x) => x.id === id);
  return p ? formatPospLabel(p.name, p.code) : "–";
}

/** Prefer API-joined posp on the deal; fall back to roster lookup. */
export function dealPospLabel(
  deal: Pick<Deal, "pospId" | "posp">,
  roster: Posp[] = [],
): string {
  if (deal.posp?.name) {
    return formatPospLabel(deal.posp.name, deal.posp.code);
  }
  if (deal.pospId) {
    const fromRoster = pospName(roster, deal.pospId);
    if (fromRoster !== "–") return fromRoster;
  }
  if (!deal.pospId) return "Self";
  return "—";
}

export { formatPospLabel, pospLabelFromParts };

/** Effective COA in rupees. Prefers the backend-computed coaAmount, falling back to raw coa. */
export function effectiveCoa(d: Pick<Deal, "coa" | "coaAmount">): number {
  return +(d.coaAmount ?? d.coa) || 0;
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
  const hotDeals = deals.filter((d) => d.status === "H").length;
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
      const renew = new Date(d.issued!);
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
      const coa = myDeals.reduce((a, d) => a + effectiveCoa(d), 0);
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
    policySums[d.policy].coa += effectiveCoa(d);
    policySums[d.policy].margin += +d.margin || 0;
  });
  return Object.values(policySums).sort((a, b) => b.premium - a.premium);
}

export function buildDealsCsv(deals: Deal[], posp: Posp[]): string {
  const headers = [
    "POSP Name",
    "Customer",
    "Policy Type",
    "Sum Assured",
    "Premium",
    "COA",
    "Retained Margin",
    "Status",
    "Expected Closure",
    "Proposal #",
    "Policy #",
    "Issuance Date",
    "Remarks",
  ];
  const rows = deals.map((d) => [
    dealPospLabel(d, posp),
    d.customer,
    d.policy,
    d.sum,
    d.premium,
    effectiveCoa(d),
    d.margin,
    statusLabel(d.status),
    d.expected,
    d.proposal,
    d.policyNo,
    d.issued,
    d.remarks,
  ]);
  return [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

export function downloadCsv(csv: string, filename = "deals-export.csv"): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Fetches a CSV from the given backend path (with optional query params)
 * and triggers a browser download. Auth cookies are forwarded automatically.
 * Throws on HTTP errors.
 */
export async function fetchAndDownloadCsv(
  path: string,
  filename: string,
  params?: URLSearchParams,
): Promise<void> {
  const qs = params?.toString();
  const url = qs ? `${path}?${qs}` : path;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`CSV export failed: ${res.status}`);
  const csv = await res.text();
  downloadCsv(csv, filename);
}

export function marginPercent(margin: number, premium: number): string {
  return premium ? ((margin / premium) * 100).toFixed(1) + "%" : "–";
}
