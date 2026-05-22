export type DealStatus = "H" | "W" | "C";

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
  issued: string;
  remarks: string;
}

export interface CrmState {
  posp: Posp[];
  deals: Deal[];
}

export type DealInput = Omit<Deal, "id"> & { id?: string };
export type PospInput = Omit<Posp, "id"> & { id?: string };
