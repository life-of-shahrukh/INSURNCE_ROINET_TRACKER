export type UserRole =
  | 'SUPER_ADMIN'
  | 'NATIONAL_HEAD'
  | 'ZH'
  | 'RH'
  | 'ASM'
  | 'DM'
  | 'POSP';

export type UserStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE';

/** Numeric rank for hierarchy comparisons (higher = more access). */
export const ROLE_RANK: Record<UserRole, number> = {
  SUPER_ADMIN:   100,
  NATIONAL_HEAD:  80,
  ZH:             60,
  RH:             40,
  ASM:            20,
  DM:             10,
  POSP:            5,
};

export function hasMinRole(userRole: UserRole, minRole: UserRole): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[minRole];
}

export function isManager(role: UserRole): boolean {
  return hasMinRole(role, 'ASM');
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  pospId: string | null;
}

export interface LoginResponse {
  // Cookie is set server-side; the response body is just the user profile.
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPospPayload {
  name: string;
  code: string;
  mobile: string;
  email: string;
  joined: string;
  active: boolean;
  password: string;
}
