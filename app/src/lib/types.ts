// Customer types for frontend
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

// Lead types
export interface Lead {
  id: string;
  customerId: string;
  customer?: Customer;
  assignedToId?: string;
  product: 'LIFE' | 'HEALTH' | 'MOTOR';
  estimatedPremium: number;
  estimatedSum?: number;
  closureTimeline: 'THIS_MONTH' | 'T_PLUS_1' | 'T_PLUS_2' | 'LATER';
  expectedCloseDate?: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL_SENT' | 'WON' | 'LOST';
  source?: string;
  remarks?: string;
  convertedToDealId?: string;
  convertedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// SalesTeam types
export interface SalesTeam {
  id: string;
  userId: string;
  name: string;
  employeeCode: string;
  designation: string;
  managerId?: string;
  manager?: SalesTeam;
  territory?: string;
  mobile: string;
  email: string;
  joiningDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  createdAt: string;
  updatedAt: string;
}

// Deal types (for legacy CRM provider compatibility)
export type DealStatus = 'H' | 'W' | 'C';

// COA entry mode: PERCENT (of premium) | AMOUNT (rupees)
export type CoaType = 'PERCENT' | 'AMOUNT';

export interface DealPospSummary {
  id: string;
  name: string;
  code: string;
}

export interface Deal {
  id: string;
  pospId: string | null;
  /** Joined from API when listing deals — avoids roster lookup limits */
  posp?: DealPospSummary | null;
  customerId: string | null;
  customer: string;
  policy: string;
  sum: number;
  premium: number;
  // Raw COA value as entered (interpret with coaType)
  coa: number;
  coaType: CoaType;
  // Computed effective COA in rupees (use this for sums)
  coaAmount: number;
  margin: number;
  status: DealStatus;
  expected: Date;
  proposal: string;
  policyNo: string;
  issued?: Date;
  remarks: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DealInput {
  id?: string;
  pospId?: string;
  customerId?: string;
  customer: string;
  policy: string;
  sum: number;
  premium: number;
  // COA fields are SUPER_ADMIN-only; omitted from the payload for other roles.
  coa?: number;
  coaType?: CoaType;
  margin?: number;
  status: DealStatus;
  expected: Date;
  proposal?: string;
  policyNo?: string;
  issued?: Date;
  remarks: string;
}

// POSP types (for legacy CRM provider compatibility)
export interface Posp {
  id: string;
  name: string;
  code: string;
  mobile: string;
  email: string;
  joined: Date;
  active: boolean;
  dealCount?: number;
  premiumTotal?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PospInput {
  id?: string;
  name: string;
  code: string;
  mobile: string;
  email: string;
  joined: Date;
  active: boolean;
  stateId?: string | null;
  stateName?: string | null;
  districtId?: string | null;
  districtName?: string | null;
  cityId?: string | null;
  cityName?: string | null;
}

// CRM state (for legacy CRM provider compatibility)
export interface CrmState {
  posp: Posp[];
  deals: Deal[];
}
