export type DealStatus = 'H' | 'W' | 'C';

export interface Posp {
  id: string;
  name: string;
  code: string;
  mobile: string;
  email: string;
  joined: string;
  active: boolean;
}

export interface Deal {
  id: string;
  pospId: string;
  customer: string;
  policy: string;
  sum: number;
  premium: number;
  coa: number;
  margin: number;
  status: DealStatus;
  expected: string;
  proposal: string;
  policyNo: string;
  issued: string | null;
  remarks: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrmState {
  posp: Posp[];
  deals: Deal[];
}

export type DealInput = Omit<Deal, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PospInput = Omit<Posp, 'id'> & { id?: string };
