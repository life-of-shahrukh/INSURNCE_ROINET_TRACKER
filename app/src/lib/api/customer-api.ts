import type { PaginatedResponse } from './pagination-types';
import { fetchPaginated, request } from './fetch-client';

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

export const customerApi = {
  getAll(params?: URLSearchParams): Promise<PaginatedResponse<Customer>> {
    return fetchPaginated<Customer>('/api/customers', params);
  },

  search(q: string): Promise<Customer[]> {
    return request<Customer[]>(`/api/customers/search?q=${encodeURIComponent(q)}`);
  },

  create(data: CreateCustomerInput): Promise<Customer> {
    return request<Customer>('/api/customers', { method: 'POST', body: JSON.stringify(data) });
  },

  update(id: string, data: Partial<CreateCustomerInput>): Promise<Customer> {
    return request<Customer>(`/api/customers/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },
};
