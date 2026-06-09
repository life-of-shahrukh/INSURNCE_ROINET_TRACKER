/** Sales Team API client — uses HttpOnly cookie session */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

export const salesTeamApi = {
  getAll(): Promise<SalesTeam[]> {
    return apiFetch(`${API_BASE}/api/sales-team`);
  },
  getHierarchy(): Promise<SalesTeam[]> {
    return apiFetch(`${API_BASE}/api/sales-team/hierarchy`);
  },
  create(data: CreateSalesTeamInput): Promise<SalesTeam> {
    return apiFetch(`${API_BASE}/api/sales-team`, { method: 'POST', body: JSON.stringify(data) });
  },
  update(id: string, data: UpdateSalesTeamInput): Promise<SalesTeam> {
    return apiFetch(`${API_BASE}/api/sales-team/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },
  syncFromApi(): Promise<{ synced: number }> {
    return apiFetch(`${API_BASE}/api/sales-team/sync`, { method: 'POST' });
  },
  getOrgChart(): Promise<OrgNode[]> {
    return apiFetch(`${API_BASE}/api/sales-team/org-chart`);
  },
};
