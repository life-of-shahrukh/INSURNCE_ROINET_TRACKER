import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, ROLE_RANK } from '../constants';
import {
  ROLES_KEY,
  MIN_ROLE_KEY,
  PUBLIC_KEY,
} from '../decorators/roles.decorator';
import { AuthUser } from '../auth/auth-user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = req.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException(
        `Account is not active (status: ${user.status})`,
      );
    }

    // --- MinRole check (hierarchical) ---
    const minRole = this.reflector.getAllAndOverride<Role>(MIN_ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (minRole !== undefined) {
      const userRank = ROLE_RANK[user.role] ?? 0;
      const requiredRank = ROLE_RANK[minRole] ?? 0;
      this.logger.debug(
        `MinRole check: user=${user.email} role=${user.role}(rank=${userRank}) required=${minRole}(rank=${requiredRank})`,
      );
      if (userRank >= requiredRank) return true;
      this.deny(user, `minimum role ${minRole}`);
    }

    // --- Explicit Roles check (OR logic) ---
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    // SUPER_ADMIN always passes explicit role checks
    if (user.role === Role.SUPER_ADMIN) return true;

    // Use string comparison to avoid TS narrowing stripping valid runtime matches
    if ((requiredRoles as string[]).includes(user.role)) return true;

    this.logger.warn(
      `Role mismatch: user=${user.email} has role="${user.role}" — required one of: ${requiredRoles.join(', ')}`,
    );
    this.deny(user, requiredRoles.join(' or '));
  }

  private deny(user: AuthUser, required: string): never {
    throw new ForbiddenException(
      `Insufficient permissions for ${user.email} [role: ${user.role}]. Required: ${required}`,
    );
  }
}
