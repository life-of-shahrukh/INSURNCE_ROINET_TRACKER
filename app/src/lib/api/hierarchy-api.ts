import { request } from './fetch-client';

export interface FilterOptionItem {
  id: string;
  name: string;
  designation?: string;
}

export interface HierarchyFilterOptions {
  /** Caller's own role */
  callerRole: string;
  /** Role label directly below the caller ('POSP' if caller is a DM) */
  nextLevel: string | null;
  /** Particular people at `nextLevel` within the caller's scope */
  subordinates: FilterOptionItem[];
  /** Geographic dimensions, scoped to the caller's territory */
  states: FilterOptionItem[];
  districts: FilterOptionItem[];
  cities: FilterOptionItem[];
  /** Manager-level dimensions, scoped to the caller's territory */
  dms: FilterOptionItem[];
  asms: FilterOptionItem[];
  rhs: FilterOptionItem[];
}

export interface SubordinatesResult {
  /** Role label of `members` ('POSP' returns `posps` instead) */
  nextLevel: string | null;
  members: FilterOptionItem[];
  posps: FilterOptionItem[];
}

export const hierarchyApi = {
  getFilterOptions(): Promise<HierarchyFilterOptions> {
    return request<HierarchyFilterOptions>('/api/hierarchy/filter-options');
  },

  /** Drill into a specific manager (identified by level + external code). */
  getSubordinates(level: string, code: string): Promise<SubordinatesResult> {
    return request<SubordinatesResult>(
      `/api/hierarchy/subordinates?level=${encodeURIComponent(level)}&code=${encodeURIComponent(code)}`,
    );
  },
};
