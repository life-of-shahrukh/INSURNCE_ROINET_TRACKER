export type DealStatus = 'H' | 'W' | 'C';

export type DealStage = 'open' | 'issued' | 'lost';

export type QuoteLine = 'life' | 'health' | 'motor';

export type QuoteStatus = 'requested' | 'quote_sent' | 'closed';

export type StrategicBand = 'week' | 'month' | 'quarter';

export interface Posp {
  id: string;
  name: string;
  code: string;
  mobile: string;
  email: string;
  joined: string;
  active: boolean;
  region: string;
  area: string;
  asm: string;
  rm: string;
}

export interface Deal {
  id: string;
  leadNo: string;
  pospId: string;
  customer: string;
  policy: string;
  sum: number;
  premium: number;
  coa: number;
  margin: number;
  brokerage: number;
  status: DealStatus;
  stage: DealStage;
  lastUpdated: string;
  expected: string;
  proposal: string;
  policyNo: string;
  issued: string | null;
  insurer: string;
  remarks: string;
  createdAt: string;
  updatedAt: string;
}

export interface Manager {
  name: string;
  location: string;
  title: string;
  salary: number;
}

export interface FieldVisit {
  id: string;
  person: string;
  pospId: string;
  date: string;
  lat: number;
  lng: number;
  notes: string;
}

export interface StrategicAccount {
  id: string;
  name: string;
  band: StrategicBand;
  expected: string;
  stage: DealStage;
  value: number;
  owner: string;
  update: string;
  updatedOn: string;
  source: string;
}

export interface QuoteRequest {
  id: string;
  dealId: string;
  line: QuoteLine;
  customer: string;
  sum: number;
  requestedBy: string;
  requestedOn: string;
  status: QuoteStatus;
  notes: string;
}

export interface BulletinPost {
  id: string;
  date: string;
  author: string;
  text: string;
}

export interface RecruitmentTargets {
  asm: Record<string, number>;
}

export interface CrmState {
  posp: Posp[];
  deals: Deal[];
  managers: Manager[];
  targets: RecruitmentTargets;
  visits: FieldVisit[];
  strategic: StrategicAccount[];
  quotes: QuoteRequest[];
  bulletin: BulletinPost[];
}

export type DealInput = Omit<Deal, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PospInput = Omit<Posp, 'id'> & { id?: string };

export type BulletinInput = Omit<BulletinPost, 'id'> & { id?: string };
