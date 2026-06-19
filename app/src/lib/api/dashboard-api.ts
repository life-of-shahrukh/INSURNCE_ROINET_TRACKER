import { request } from './fetch-client';

export interface DashboardStats {
  deals: {
    totalPremium: number;
    /** null for roles below SUPER_ADMIN — stripped server-side */
    totalMargin: number | null;
    /** null for roles below SUPER_ADMIN — stripped server-side */
    totalCoa: number | null;
    count: number;
    avgPremium: number;
    hotCount: number;
    warmCount: number;
    coldCount: number;
    issuedCount: number;
    /** 0-100 */
    conversionRate: number;
    /** null for roles below SUPER_ADMIN — stripped server-side */
    costPerIssuedPolicy: number | null;
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
    /** Per-district breakdown — populated for manager roles */
    byDistrict: Array<{
      districtId: string;
      districtName: string;
      premium: number;
      count: number;
      pospCount: number;
    }>;
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
  /** Team overview for manager roles; null for POSP */
  team: {
    districtCount: number;
    subordinateCounts: Partial<Record<string, number>>;
  } | null;
}

export const EMPTY_STATS: DashboardStats = {
  deals: {
    totalPremium: 0,
    totalMargin: null,
    totalCoa: null,
    count: 0,
    avgPremium: 0,
    hotCount: 0,
    warmCount: 0,
    coldCount: 0,
    issuedCount: 0,
    conversionRate: 0,
    costPerIssuedPolicy: null,
    avgDaysToIssue: 0,
    byPolicy: [],
    topPosps: [],
    monthlyPremium: [],
    byDistrict: [],
  },
  leads: { total: 0, activeCount: 0, byStatus: [], byTimeline: [], bySource: [] },
  posps: { total: 0, active: 0 },
  customers: { total: 0, byKycStatus: [] },
  team: null,
};

/**
 * Builds query params for the dashboard stats endpoint.
 * Supports all standard params plus hierarchy-specific zoneId/regionId narrowing.
 */
export interface DashboardStatsParams {
  dateRange?: string;
  dateFrom?: string;
  dateTo?: string;
  /** Narrow to specific zone (Cognitensor ZoneId) */
  zoneId?: string;
  /** Narrow to specific region (Cognitensor regionid from ListDistrict) */
  regionId?: string;
  stateId?: string;
  districtId?: string;
  cityId?: string;
  /** Drill into a specific subordinate's territory */
  subordinateLevel?: string;
  subordinateCode?: string;
  pospId?: string;
}

export const dashboardApi = {
  getStats(params?: URLSearchParams | DashboardStatsParams): Promise<DashboardStats> {
    let qs: string | undefined;
    if (params instanceof URLSearchParams) {
      qs = params.toString();
    } else if (params) {
      const sp = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') {
          sp.set(k, String(v));
        }
      }
      qs = sp.toString();
    }
    const url = qs ? `/api/dashboard/stats?${qs}` : '/api/dashboard/stats';
    return request<DashboardStats>(url);
  },
};
