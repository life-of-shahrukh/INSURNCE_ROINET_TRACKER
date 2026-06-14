/**
 * Dashboard Widget Registry
 *
 * Single source of truth for which widgets each role can see.
 *
 * Access model: CUMULATIVE UP THE HIERARCHY.
 * A widget is visible when ROLE_RANK[userRole] >= ROLE_RANK[widget.minRole].
 * SUPER_ADMIN (rank 100) sees everything; POSP (rank 5) sees only rank-5 widgets.
 *
 * Financial widgets (COA / margin / cost-per-issued) are explicitly tagged
 * `financial: true` and gated to SUPER_ADMIN only.
 */

import { ROLE_RANK, type UserRole } from './auth-types';

// ── Widget catalogue ──────────────────────────────────────────────────────────

export const DASHBOARD_WIDGETS = {
  // ── KPI Cards ─────────────────────────────────────────────────────────────
  TOTAL_PREMIUM:     { minRole: 'POSP'        as UserRole, financial: false, label: 'Total Premium' },
  HOT_DEALS:         { minRole: 'POSP'        as UserRole, financial: false, label: 'Hot Deals' },
  LEAD_PIPELINE:     { minRole: 'POSP'        as UserRole, financial: false, label: 'Lead Pipeline' },
  CONVERSION:        { minRole: 'POSP'        as UserRole, financial: false, label: 'Conversion Rate' },
  AVG_PREMIUM:       { minRole: 'POSP'        as UserRole, financial: false, label: 'Avg Premium' },
  PIPELINE_VELOCITY: { minRole: 'ASM'         as UserRole, financial: false, label: 'Pipeline Velocity' },
  POSP_KPI:          { minRole: 'DM'          as UserRole, financial: false, label: 'POSP Count' },
  CUSTOMERS_KPI:     { minRole: 'ZH'          as UserRole, financial: false, label: 'Customers' },
  /** Financial — SUPER_ADMIN only */
  RETAINED_MARGIN:   { minRole: 'SUPER_ADMIN' as UserRole, financial: true,  label: 'Retained Margin' },
  /** Financial — SUPER_ADMIN only */
  COST_PER_ISSUED:   { minRole: 'SUPER_ADMIN' as UserRole, financial: true,  label: 'Cost / Issued Policy' },

  // ── Charts ────────────────────────────────────────────────────────────────
  DEALS_BY_STATUS:   { minRole: 'POSP'        as UserRole, financial: false, label: 'Deals by Status' },
  PREMIUM_BY_POLICY: { minRole: 'POSP'        as UserRole, financial: false, label: 'Premium by Policy Type' },
  MONTHLY_PREMIUM:   { minRole: 'POSP'        as UserRole, financial: false, label: 'Premium Trend (Monthly)' },
  LEAD_SOURCES:      { minRole: 'POSP'        as UserRole, financial: false, label: 'Lead Sources' },
  CLOSURE_TIMELINE:  { minRole: 'POSP'        as UserRole, financial: false, label: 'Deal Closure Timeline' },
  LEAD_STATUS:       { minRole: 'POSP'        as UserRole, financial: false, label: 'Lead Status Breakdown' },
  TOP_POSP:          { minRole: 'DM'          as UserRole, financial: false, label: 'Top POSPs' },
  KYC_STATUS:        { minRole: 'ZH'          as UserRole, financial: false, label: 'Customer KYC Status' },
} as const;

export type WidgetId = keyof typeof DASHBOARD_WIDGETS;

// ── Access helpers ────────────────────────────────────────────────────────────

/**
 * Returns true when `role` meets or exceeds the widget's minimum role rank.
 * Cumulative: SUPER_ADMIN sees every widget; POSP sees only POSP-min widgets.
 */
export function canSeeWidget(role: UserRole | undefined, widgetId: WidgetId): boolean {
  if (!role) return false;
  const { minRole } = DASHBOARD_WIDGETS[widgetId];
  return ROLE_RANK[role] >= ROLE_RANK[minRole];
}

/**
 * Returns the set of widget IDs visible to the given role.
 * Useful for rendering loops or unit-testing the full matrix.
 */
export function getVisibleWidgets(role: UserRole | undefined): ReadonlySet<WidgetId> {
  if (!role) return new Set();
  return new Set(
    (Object.keys(DASHBOARD_WIDGETS) as WidgetId[]).filter((id) =>
      canSeeWidget(role, id),
    ),
  );
}

/** All widget IDs tagged as financial (COA / margin / cost metrics). */
export const FINANCIAL_WIDGET_IDS: ReadonlySet<WidgetId> = new Set(
  (Object.keys(DASHBOARD_WIDGETS) as WidgetId[]).filter(
    (id) => DASHBOARD_WIDGETS[id].financial,
  ),
);
