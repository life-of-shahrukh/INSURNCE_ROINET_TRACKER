import { Role, UserStatus } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  status: UserStatus;
  pospId?: string;
}
