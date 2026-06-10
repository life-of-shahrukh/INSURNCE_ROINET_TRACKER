import { ForbiddenException } from '@nestjs/common';
import { Role, ROLE_RANK } from '../constants';
import { AuthUser } from './auth-user.interface';

/** Returns true when the user has management-level access (ASM and above). */
export function isManager(user: AuthUser): boolean {
  return ROLE_RANK[user.role] >= ROLE_RANK[Role.ASM];
}

/**
 * Resolves which pospId to use for a deal operation.
 * - POSP: always uses their own pospId; rejects if they try to act for another.
 * - Managers (ASM+): must supply a pospId in the payload.
 */
export function resolvePospScope(
  user: AuthUser,
  pospIdFromPayload?: string,
): string {
  if (isManager(user)) {
    if (!pospIdFromPayload) {
      throw new ForbiddenException(
        'Please supply a POSP ID for this operation',
      );
    }
    return pospIdFromPayload;
  }

  // POSP role
  if (!user.pospId) {
    throw new ForbiddenException('POSP account is not linked to a profile');
  }

  if (pospIdFromPayload && pospIdFromPayload !== user.pospId) {
    throw new ForbiddenException('Cannot act on behalf of another POSP');
  }

  return user.pospId;
}
