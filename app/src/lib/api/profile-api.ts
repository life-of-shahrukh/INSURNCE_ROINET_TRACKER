import { request } from './fetch-client';

export interface ProfileUser {
  id: string;
  email: string;
  role: string;
  status: string;
}

export interface ProfilePosp {
  id: string;
  name: string;
  code: string;
  externalId: string | null;
  gcdCode: string | null;
  mobile: string;
  email: string;
  joined: string;
  active: boolean;
  region: string | null;
  zoneId: string | null;
  regionId: string | null;
  areaId: string | null;
  districtId: string | null;
}

export interface ProfileSalesTeam {
  id: string;
  name: string;
  employeeCode: string;
  designation: string;
  mobile: string;
  email: string;
  joiningDate: string;
  status: string;
  zoneId: string | null;
  zoneName: string | null;
  regionId: string | null;
  regionName: string | null;
  areaId: string | null;
  areaName: string | null;
  managerId: string | null;
  territory: string | null;
}

export interface TeamPersonReportsTo {
  id: string;
  name: string;
  role: string;
  label: string;
}

export interface TeamPerson {
  id: string;
  name: string;
  role: string;
  label: string;
  code?: string;
  stateName?: string | null;
  districtName?: string | null;
  cityName?: string | null;
  reportsTo?: TeamPersonReportsTo | null;
}

export interface RoleTeamBucket {
  role: string;
  label: string;
  directCount: number;
  totalCount: number;
  members: TeamPerson[];
}

export interface DownlineTeamSummary {
  mode: 'downline';
  districtCount: number;
  pospCount: number;
  managerCount: number;
  roles: RoleTeamBucket[];
}

export interface UplineTeamSummary {
  mode: 'upline';
  districtName: string | null;
  reportingChain: TeamPerson[];
}

export type ProfileTeamSummary = DownlineTeamSummary | UplineTeamSummary;

export interface ProfileResponse {
  userCode?: string;
  user: ProfileUser;
  posp?: ProfilePosp;
  salesTeam?: ProfileSalesTeam;
  teamSummary?: ProfileTeamSummary;
}

export const profileApi = {
  async getMe(): Promise<ProfileResponse> {
    return request<ProfileResponse>('/api/profile');
  },

  async getByUserCode(userCode: string): Promise<ProfileResponse> {
    const encoded = encodeURIComponent(userCode.trim());
    return request<ProfileResponse>(`/api/profile/by-code/${encoded}`);
  },
};
