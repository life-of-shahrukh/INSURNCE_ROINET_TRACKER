import { Role, UserStatus } from '@prisma/client';

export interface AuthUser {
  userId: string;
  email: string;
  role: Role;
  status: UserStatus;
  pospId?: string;
}
