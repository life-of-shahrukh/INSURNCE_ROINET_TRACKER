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
} from '../external-api-types';

export const externalApi = {
  /** All Indian states */
  async getStates(): Promise<State[]> {
    return request<State[]>('/api/external/states');
  },

  /** Districts for a given stateId */
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

  /** Reverse-lookup: given a districtId, returns its stateId + name */
  async getDistrictById(districtId: string): Promise<{ districtId: string; districtName: string; stateId: string } | null> {
    if (!districtId) return null;
    const result = await request<{ districtId?: string; districtName?: string; stateId?: string }>(
      `/api/external/district-by-id?districtId=${encodeURIComponent(districtId)}`,
    );
    if (!result.stateId) return null;
    return result as { districtId: string; districtName: string; stateId: string };
  },

  /** Full district → DM → ASM → ZH → NH hierarchy */
  async getHierarchyUserData(): Promise<HierarchyUser[]> {
    return request<HierarchyUser[]>('/api/external/hierarchy');
  },

  /** Paginated + filtered POSP list */
  async getPosps(params?: URLSearchParams): Promise<PaginatedResponse<PospData>> {
    const qs = params?.toString();
    const url = qs ? `/api/external/posps?${qs}` : '/api/external/posps';
    return request<PaginatedResponse<PospData>>(url);
  },
};
