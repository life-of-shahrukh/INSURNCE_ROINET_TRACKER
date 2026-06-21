import { Role, UserStatus } from '../../common/constants';
import { orgRoleLabel } from '../../common/external-api/user-type.util';
import type { AuthUserPayload } from './auth.service';

interface UserAuthShape {
  id: string;
  email: string;
  role: string;
  status: string;
  pospId: string | null;
  salesTeam?: { designation: string } | null;
}

/** Auth session payload — app `role` for RBAC, `roleLabel` for UI when org role differs. */
export function buildAuthUserPayload(user: UserAuthShape): AuthUserPayload {
  const orgRole = user.salesTeam?.designation ?? null;
  let roleLabel: string | undefined;

  if (orgRole) {
    roleLabel = orgRoleLabel(orgRole);
  } else if (user.role === Role.POSP) {
    roleLabel = 'POSP Agent';
  } else {
    roleLabel = orgRoleLabel(user.role);
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role as Role,
    status: user.status as UserStatus,
    pospId: user.pospId,
    ...(orgRole ? { orgRole } : {}),
    ...(roleLabel ? { roleLabel } : {}),
  };
}
