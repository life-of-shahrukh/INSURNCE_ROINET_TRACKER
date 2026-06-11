import type { PaginatedResponse } from './pagination-types';
import { fetchPaginated, request } from './fetch-client';

export interface SalesTeam {
  id: string;
  userId: string;
  name: string;
  employeeCode: string;
  designation: string;
  managerId?: string;
  manager?: { id: string; name: string; designation: string };
  subordinates?: SalesTeam[];
  territory?: string;
  mobile: string;
  email: string;
  joiningDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  pospsManaged?: { id: string; name: string; code: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSalesTeamInput {
  userId: string;
  name: string;
  employeeCode: string;
  designation: string;
  managerId?: string;
  territory?: string;
  mobile: string;
  email: string;
  joiningDate: string;
}

export type UpdateSalesTeamInput = Partial<CreateSalesTeamInput> & { status?: string };

export interface OrgNode {
  id: string;
  parentId: string | null;
  name: string;
  employeeCode: string;
  level: number;
  designation: string;
  districtName?: string;
}

export const salesTeamApi = {
  getAll(params?: URLSearchParams): Promise<PaginatedResponse<SalesTeam>> {
    return fetchPaginated<SalesTeam>('/api/sales-team', params);
  },

  getHierarchy(): Promise<SalesTeam[]> {
    return request<SalesTeam[]>('/api/sales-team/hierarchy');
  },

  create(data: CreateSalesTeamInput): Promise<SalesTeam> {
    return request<SalesTeam>('/api/sales-team', { method: 'POST', body: JSON.stringify(data) });
  },

  update(id: string, data: UpdateSalesTeamInput): Promise<SalesTeam> {
    return request<SalesTeam>(`/api/sales-team/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },

  syncFromApi(): Promise<{ synced: number }> {
    return request<{ synced: number }>('/api/sales-team/sync', { method: 'POST' });
  },

  getOrgChart(): Promise<OrgNode[]> {
    return request<OrgNode[]>('/api/sales-team/org-chart');
  },
};
