import { Role, UserStatus } from '../constants';

export interface AuthUser {
  userId: string;
  email: string;
  role: Role;
  status: UserStatus;
  pospId?: string;
}
