import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../constants';
import {
  ROLES_KEY,
  REQUIRE_ALL_ROLES_KEY,
  PUBLIC_KEY,
} from '../decorators/roles.decorator';
import { AuthUser } from '../auth/auth-user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Get required roles from decorator
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No roles specified = route is protected but any authenticated user can access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Get user from request
    const req = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = req.user;

    if (!user) {
      this.logger.warn('No user found in request for role-protected route');
      throw new ForbiddenException('Authentication required');
    }

    // Check if user has active status
    if (user.status !== 'ACTIVE') {
      this.logger.warn(
        `User ${user.email} with status ${user.status} attempted to access protected route`,
      );
      throw new ForbiddenException('Account is not active');
    }

    // Check if all roles are required (AND logic) or any role (OR logic)
    const requireAllRoles = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_ALL_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const hasAccess = requireAllRoles
      ? this.hasAllRoles(user, requiredRoles)
      : this.hasAnyRole(user, requiredRoles);

    if (!hasAccess) {
      this.logger.warn(
        `User ${user.email} with role ${user.role} attempted to access route requiring roles: ${requiredRoles.join(', ')}`,
      );
      throw new ForbiddenException(
        `Insufficient permissions. Required role${requiredRoles.length > 1 ? 's' : ''}: ${requiredRoles.join(' or ')}`,
      );
    }

    return true;
  }

  /**
   * Check if user has ANY of the required roles (OR logic)
   */
  private hasAnyRole(user: AuthUser, requiredRoles: Role[]): boolean {
    return requiredRoles.includes(user.role);
  }

  /**
   * Check if user has ALL of the required roles (AND logic)
   * Note: Current system only supports single role per user
   * This is prepared for future multi-role support
   */
  private hasAllRoles(user: AuthUser, requiredRoles: Role[]): boolean {
    // For now, since users have single role, check if that role is in required roles
    // In future with multi-role support, this would check if user has all roles
    return requiredRoles.includes(user.role);
  }
}
