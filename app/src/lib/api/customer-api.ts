/** Customer API client — uses HttpOnly cookie session */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Customer {
  id: string;
  name: string;
  email?: string;
  mobile: string;
  alternateMobile?: string;
  dateOfBirth?: string;
  panNumber?: string;
  aadharNumber?: string;
  stateId?: string;
  stateName?: string;
  districtId?: string;
  districtName?: string;
  cityId?: string;
  cityName?: string;
  address?: string;
  pincode?: string;
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  source?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerInput {
  name: string;
  email?: string;
  mobile: string;
  alternateMobile?: string;
  dateOfBirth?: Date;
  panNumber?: string;
  aadharNumber?: string;
  stateId?: string;
  stateName?: string;
  districtId?: string;
  districtName?: string;
  cityId?: string;
  cityName?: string;
  address?: string;
  pincode?: string;
  source?: string;
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

export const customerApi = {
  getAll(): Promise<Customer[]> {
    return apiFetch(`${API_BASE}/api/customers`);
  },
  search(q: string): Promise<Customer[]> {
    return apiFetch(`${API_BASE}/api/customers/search?q=${encodeURIComponent(q)}`);
  },
  create(data: CreateCustomerInput): Promise<Customer> {
    return apiFetch(`${API_BASE}/api/customers`, { method: 'POST', body: JSON.stringify(data) });
  },
  update(id: string, data: Partial<CreateCustomerInput>): Promise<Customer> {
    return apiFetch(`${API_BASE}/api/customers/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },
};
