import { ForbiddenException } from '@nestjs/common';
import { Role, ROLE_RANK } from '../constants';
import { AuthUser } from './auth-user.interface';

/**
 * Returns true when the user has management-level access (DM and above).
 */
export function isManager(user: AuthUser): boolean {
  return ROLE_RANK[user.role] >= ROLE_RANK[Role.DM];
}

/**
 * Resolves which pospId to use for a deal operation.
 *
 * - POSP users: always use their own pospId; reject if they try to act for another.
 * - Managers (DM+): may supply a scoped pospId when **updating** an existing deal.
 *   Create (`POST /api/deals`) is POSP-only — managers do not originate deals.
 */
export function resolvePospScope(
  user: AuthUser,
  pospIdFromPayload?: string,
): string | undefined {
  if (isManager(user)) {
    // Managers can choose any POSP within their scope (scoping is enforced
    // at the query level via HierarchyScopeInterceptor on GET /api/posp).
    // Returning undefined signals a Self-issued deal (pospId = null in DB).
    return pospIdFromPayload || undefined;
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
