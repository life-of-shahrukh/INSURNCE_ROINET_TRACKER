import { request } from './fetch-client';

export interface FilterOptionItem {
  id: string;
  name: string;
  designation?: string;
}

export interface HierarchyFilterOptions {
  zones: FilterOptionItem[];
  regions: FilterOptionItem[];
  areas: FilterOptionItem[];
  districts: FilterOptionItem[];
  subordinates: FilterOptionItem[];
  posps: FilterOptionItem[];
}

export interface SubordinatesResult {
  members: FilterOptionItem[];
  posps: FilterOptionItem[];
}

export const hierarchyApi = {
  getFilterOptions(): Promise<HierarchyFilterOptions> {
    return request<HierarchyFilterOptions>('/api/hierarchy/filter-options');
  },

  getSubordinates(salesTeamId: string): Promise<SubordinatesResult> {
    return request<SubordinatesResult>(
      `/api/hierarchy/subordinates?salesTeamId=${encodeURIComponent(salesTeamId)}`,
    );
  },
};
