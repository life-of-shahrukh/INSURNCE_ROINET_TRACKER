import { request } from './fetch-client';

export interface FilterOptionItem {
  id: string;
  name: string;
}

export interface HierarchyFilterOptions {
  zones: FilterOptionItem[];
  regions: FilterOptionItem[];
  areas: FilterOptionItem[];
  districts: FilterOptionItem[];
  subordinates: FilterOptionItem[];
  posps: FilterOptionItem[];
}

export const hierarchyApi = {
  getFilterOptions(): Promise<HierarchyFilterOptions> {
    return request<HierarchyFilterOptions>('/api/hierarchy/filter-options');
  },
};
