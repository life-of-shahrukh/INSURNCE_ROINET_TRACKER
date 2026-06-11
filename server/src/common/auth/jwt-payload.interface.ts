import { Role, UserStatus } from '../constants';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  status: UserStatus;
  pospId?: string;
}
