/** Aggregated dashboard stats returned by GET /api/dashboard/stats */
export interface DashboardStats {
  deals: {
    totalPremium: number;
    /** null for roles below SUPER_ADMIN — financial field, stripped server-side */
    totalMargin: number | null;
    /** null for roles below SUPER_ADMIN — financial field, stripped server-side */
    totalCoa: number | null;
    count: number;
    avgPremium: number;
    hotCount: number;
    warmCount: number;
    coldCount: number;
    /** Raw deal status breakdown — actual DB values (e.g. ACTIVE, H, W, C, D) */
    byStatus: Array<{ status: string; count: number }>;
    issuedCount: number;
    /** 0-100 percentage */
    conversionRate: number;
    /** null for roles below SUPER_ADMIN — financial field, stripped server-side */
    costPerIssuedPolicy: number | null;
    /** Avg days from deal created to issued (pipeline velocity) */
    avgDaysToIssue: number;
    byPolicy: Array<{ policy: string; premium: number; count: number }>;
    topPosps: Array<{
      pospId: string;
      name: string;
      premium: number;
      count: number;
    }>;
    /** Monthly trend: premium grouped by year-month */
    monthlyPremium: Array<{ month: string; premium: number; count: number }>;
  };
  leads: {
    total: number;
    activeCount: number;
    byStatus: Array<{ status: string; count: number }>;
    byTimeline: Array<{ timeline: string; count: number }>;
    /** Lead source breakdown (referral, walk-in, digital, etc.) */
    bySource: Array<{ source: string; count: number }>;
  };
  posps: {
    total: number;
    active: number;
  };
  customers: {
    total: number;
    byKycStatus: Array<{ kycStatus: string; count: number }>;
  };
}
