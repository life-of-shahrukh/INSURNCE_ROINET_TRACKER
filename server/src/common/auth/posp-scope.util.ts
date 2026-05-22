import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthUser } from './auth-user.interface';

export function resolvePospScope(
  user: AuthUser,
  pospIdFromPayload?: string,
): string {
  if (user.role === Role.ADMIN) {
    if (!pospIdFromPayload) {
      throw new ForbiddenException('Missing POSP scope');
    }
    return pospIdFromPayload;
  }

  if (!user.pospId) {
    throw new ForbiddenException('POSP account is not linked');
  }

  if (pospIdFromPayload && pospIdFromPayload !== user.pospId) {
    throw new ForbiddenException('Cannot access another POSP record');
  }

  return user.pospId;
}
