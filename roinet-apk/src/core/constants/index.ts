export const POLICY_TYPES = [
  'Life',
  'Health',
  'Motor',
  'Travel',
  'Home',
  'Marine',
  'Term',
  'ULIP',
  'Personal Loan',
  'Home Loan',
  'Business Loan',
] as const;

export const CRM_SESSION_DATE = new Date('2026-05-20');

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

export const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

export const TOKEN_KEY = 'roinet_access_token';
export const USER_KEY = 'roinet_user';
