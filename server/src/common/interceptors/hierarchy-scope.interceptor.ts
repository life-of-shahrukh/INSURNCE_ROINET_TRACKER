import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import {
  resolveHierarchyScope,
  type HierarchyScope,
} from '../auth/hierarchy-scope.util';
import type { AuthUser } from '../auth/auth-user.interface';
import { SCOPE_KEY } from '../decorators/scope.decorator';
import { HierarchyResolverService } from '../external-api/hierarchy-resolver.service';

interface RequestWithUser {
  user?: AuthUser;
  [SCOPE_KEY]?: HierarchyScope;
}

/**
 * Intercepts every request and attaches a resolved HierarchyScope to the
 * request object so controllers can pass it to query/command handlers.
 *
 * Uses HierarchyResolverService for manager roles (live API + DB fallback + cache).
 * Falls back to direct DB lookup for backward compat when resolver is unavailable.
 *
 * Usage: Apply globally in AppModule or on individual controllers:
 *   @UseInterceptors(HierarchyScopeInterceptor)
 */
@Injectable()
export class HierarchyScopeInterceptor implements NestInterceptor {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hierarchyResolver: HierarchyResolverService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const req = context.switchToHttp().getRequest<RequestWithUser>();

    if (req.user) {
      req[SCOPE_KEY] = await resolveHierarchyScope(
        req.user,
        this.prisma,
        this.hierarchyResolver,
      );
    }

    return next.handle();
  }
}
