import { SetMetadata } from '@nestjs/common';
import { Role } from '../constants';

export const ROLES_KEY = 'roles';
export const MIN_ROLE_KEY = 'minRole';
export const PUBLIC_KEY = 'isPublic';
export const REQUIRE_ALL_ROLES_KEY = 'requireAllRoles';

/**
 * Allow specific roles (OR logic — user needs any one).
 * @example @Roles(Role.SUPER_ADMIN, Role.NATIONAL_HEAD)
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Allow any role at or above the given minimum rank.
 * e.g. @MinRole(Role.RH) allows RH, ZH, NATIONAL_HEAD, SUPER_ADMIN.
 * @example @MinRole(Role.ASM)
 */
export const MinRole = (role: Role) => SetMetadata(MIN_ROLE_KEY, role);

/**
 * Mark a route as publicly accessible (no auth required).
 * @example @Public()
 */
export const Public = () => SetMetadata(PUBLIC_KEY, true);

// Legacy helpers kept for backward compat
export const AdminOnly = () => SetMetadata(ROLES_KEY, [Role.SUPER_ADMIN]);
export const PospOnly  = () => SetMetadata(ROLES_KEY, [Role.POSP]);
