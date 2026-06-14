import { request } from './fetch-client';

export interface DashboardStats {
  deals: {
    totalPremium: number;
    totalMargin: number;
    totalCoa: number;
    count: number;
    avgPremium: number;
    hotCount: number;
    warmCount: number;
    coldCount: number;
    issuedCount: number;
    /** 0-100 */
    conversionRate: number;
    /** Cost per issued policy in INR */
    costPerIssuedPolicy: number;
    /** Average calendar days from deal creation to policy issuance */
    avgDaysToIssue: number;
    byPolicy: Array<{ policy: string; premium: number; count: number }>;
    topPosps: Array<{
      pospId: string;
      name: string;
      premium: number;
      count: number;
    }>;
    /** Monthly premium trend: last 12 months */
    monthlyPremium: Array<{ month: string; premium: number; count: number }>;
  };
  leads: {
    total: number;
    activeCount: number;
    byStatus: Array<{ status: string; count: number }>;
    byTimeline: Array<{ timeline: string; count: number }>;
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

export const EMPTY_STATS: DashboardStats = {
  deals: {
    totalPremium: 0,
    totalMargin: 0,
    totalCoa: 0,
    count: 0,
    avgPremium: 0,
    hotCount: 0,
    warmCount: 0,
    coldCount: 0,
    issuedCount: 0,
    conversionRate: 0,
    costPerIssuedPolicy: 0,
    avgDaysToIssue: 0,
    byPolicy: [],
    topPosps: [],
    monthlyPremium: [],
  },
  leads: { total: 0, activeCount: 0, byStatus: [], byTimeline: [], bySource: [] },
  posps: { total: 0, active: 0 },
  customers: { total: 0, byKycStatus: [] },
};

export const dashboardApi = {
  getStats(params?: URLSearchParams): Promise<DashboardStats> {
    const qs = params?.toString();
    const url = qs ? `/api/dashboard/stats?${qs}` : '/api/dashboard/stats';
    return request<DashboardStats>(url);
  },
};
