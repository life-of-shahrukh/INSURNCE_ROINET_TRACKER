/**
 * Shared External API service (server-side)
 * Calls the RoiNet Cognitensor API from backend (no browser).
 */

const EXTERNAL_API_BASE = 'https://uatserviceapi.roinet.in';

interface CognitensorResponse<T> {
  description: string;
  Data: T[];
}

export interface HierarchyEntry {
  DistrictId: string;
  DistrictName: string;
  DistrictManagerId: string;
  DistrictManagerCode: string;
  DistrictManagerName: string;
  R1_UserId: string;
  R1_UserCode: string;
  R1_UserName: string;
  R2_UserId: string;
  R2_UserCode: string;
  R2_UserName: string;
  R3_UserId: string;
  R3_UserCode: string;
  R3_UserName: string;
  R4_UserId: string;
  R4_UserCode: string;
  R4_UserName: string;
  R5_UserId: string;
  R5_UserCode: string;
  R5_UserName: string;
}

async function apiPost<T>(
  endpoint: string,
  body?: object | string,
): Promise<T[]> {
  const response = await fetch(`${EXTERNAL_API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body || {}),
  });

  if (!response.ok)
    throw new Error(`External API ${response.status}: ${response.statusText}`);

  const wrapper = (await response.json()) as CognitensorResponse<T>;
  if (wrapper.description !== 'success')
    throw new Error(`API Error: ${wrapper.description}`);

  return wrapper.Data;
}

export const externalApi = {
  getHierarchyUserData: () =>
    apiPost<HierarchyEntry>('/Cognitensor/ListHierarchyUserData', ''),
};
