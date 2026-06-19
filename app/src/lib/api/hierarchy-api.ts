import { request } from './fetch-client';

export interface FilterOptionItem {
  id: string;
  name: string;
  designation?: string;
}

/** Managers in scope grouped by their real org role (senior-first). */
export interface RoleGroup {
  /** Org role code (ADMIN | SZH | ZH | CH | RH | ASSISTASM | ASM | CSP | ...) */
  role: string;
  /** Human-readable label ('Super Zonal Head', 'Cluster Head', ...) */
  label: string;
  members: FilterOptionItem[];
}

export interface HierarchyFilterOptions {
  /** Caller's own role */
  callerRole: string;
  /** Role label directly below the caller ('POSP' if caller is a DM) */
  nextLevel: string | null;
  /** Particular people at `nextLevel` within the caller's scope */
  subordinates: FilterOptionItem[];
  /** Managers in scope grouped by real org role, ordered senior-first. */
  roleGroups: RoleGroup[];
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
