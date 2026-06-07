export type UserRole = 'ADMIN' | 'POSP';
export type UserStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  pospId: string | null;
}

export interface LoginResponse {
  accessToken: string;
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
