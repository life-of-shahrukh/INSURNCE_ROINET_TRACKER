import type { DealStage } from '@/shared/types/crm.types';

export const INSURERS = [
  'Niva Bupa',
  'ICICI Lombard',
  'HDFC Ergo',
  'SBI General',
  'Tata AIG',
  'Care',
] as const;

export const STRATEGIC_SOURCES = [
  'Referral',
  'Direct Outreach',
  'Existing Relationship',
  'Tender / RFP',
  'Industry Event',
] as const;

export const STAGE_CONFIG: Record<DealStage, { label: string; prob: number }> = {
  open: { label: 'Open', prob: 0.3 },
  issued: { label: 'Issued', prob: 1 },
  lost: { label: 'Lost', prob: 0 },
};

export const PREMIUM_BANDS = [
  { label: '< ₹10K', min: 0, max: 9999 },
  { label: '₹10K–25K', min: 10000, max: 24999 },
  { label: '₹25K–50K', min: 25000, max: 49999 },
  { label: '₹50K–1L', min: 50000, max: 99999 },
  { label: '₹1L+', min: 100000, max: Number.MAX_SAFE_INTEGER },
] as const;

export const QUOTE_STATUS_LABELS: Record<string, string> = {
  requested: 'Requested',
  quote_sent: 'Quote Sent',
  closed: 'Closed',
};

export const STALLED_DAYS = 30;

export const DEMO_LEADERSHIP = {
  username: 'leadership',
  password: 'admin123',
  name: 'Leadership',
} as const;

export const DEMO_SALES_PASSWORD = 'sales123';
