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

export interface ProfileResponse {
  user: ProfileUser;
  posp?: ProfilePosp;
  salesTeam?: ProfileSalesTeam;
}

export const profileApi = {
  async getMe(): Promise<ProfileResponse> {
    return request<ProfileResponse>('/api/profile');
  },
};
