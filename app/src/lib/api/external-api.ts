/**
 * RoiNet Cognitensor External API Client
 *
 * All calls go through the NestJS backend at /api/external/*.
 * The backend either serves from JSON snapshots (dev) or proxies
 * to the live Cognitensor API (prod), depending on USE_EXTERNAL_API_SNAPSHOT.
 */

import { request } from './fetch-client';
import type { PaginatedResponse } from './pagination-types';
import type {
  City,
  District,
  HierarchyUser,
  PospData,
  State,
  Zone,
} from '../external-api-types';

export const externalApi = {
  /** All Indian states */
  async getStates(): Promise<State[]> {
    return request<State[]>('/api/external/states');
  },

  /** All zones (9 zones) — available to DM+ roles */
  async getZones(): Promise<Zone[]> {
    return request<Zone[]>('/api/external/zones');
  },

  /** Districts for a given stateId — now includes regionid/zoneid enrichment */
  async getDistricts(stateId: string): Promise<District[]> {
    return request<District[]>(
      `/api/external/districts?stateId=${encodeURIComponent(stateId)}`,
    );
  },

  /** Cities for a given districtId */
  async getCities(districtId: string): Promise<City[]> {
    return request<City[]>(
      `/api/external/cities?districtId=${encodeURIComponent(districtId)}`,
    );
  },

  /** Full district → DM → ASM → ZH → NH hierarchy — optionally filtered by userCode */
  async getHierarchyUserData(userCode?: string): Promise<HierarchyUser[]> {
    const qs = userCode ? `?userCode=${encodeURIComponent(userCode)}` : '';
    return request<HierarchyUser[]>(`/api/external/hierarchy${qs}`);
  },

  /** Paginated + filtered POSP list */
  async getPosps(params?: URLSearchParams): Promise<PaginatedResponse<PospData>> {
    const qs = params?.toString();
    const url = qs ? `/api/external/posps?${qs}` : '/api/external/posps';
    return request<PaginatedResponse<PospData>>(url);
  },
};
