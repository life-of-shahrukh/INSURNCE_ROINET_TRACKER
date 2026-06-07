import { SetMetadata } from '@nestjs/common';
import { Role } from '../constants';

export const ROLES_KEY = 'roles';
export const REQUIRE_ALL_ROLES_KEY = 'requireAllRoles';

/**
 * Decorator to specify which roles can access a route.
 * User needs at least ONE of the specified roles (OR logic).
 * 
 * @example
 * @Roles(Role.ADMIN, Role.POSP)
 * async findAll() { ... }
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Decorator to require ALL specified roles (AND logic).
 * User must have every role specified.
 * 
 * @example
 * @RequireAllRoles(Role.ADMIN, Role.SUPERVISOR)
 * async criticalOperation() { ... }
 */
export const RequireAllRoles = (...roles: Role[]) =>
  SetMetadata(ROLES_KEY, roles) &&
  SetMetadata(REQUIRE_ALL_ROLES_KEY, true);

/**
 * Decorator to allow only ADMIN role.
 * Shorthand for @Roles(Role.ADMIN)
 * 
 * @example
 * @AdminOnly()
 * async deleteUser() { ... }
 */
export const AdminOnly = () => SetMetadata(ROLES_KEY, [Role.ADMIN]);

/**
 * Decorator to allow only POSP role.
 * Shorthand for @Roles(Role.POSP)
 * 
 * @example
 * @PospOnly()
 * async getMyDeals() { ... }
 */
export const PospOnly = () => SetMetadata(ROLES_KEY, [Role.POSP]);

/**
 * Decorator to make a route public (bypass authentication and role checks).
 * Use with caution.
 * 
 * @example
 * @Public()
 * async health() { ... }
 */
export const PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(PUBLIC_KEY, true);
