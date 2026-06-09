import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { resolveHierarchyScope } from '../auth/hierarchy-scope.util';
import type { AuthUser } from '../auth/auth-user.interface';
import { SCOPE_KEY } from '../decorators/scope.decorator';

interface RequestWithUser {
  user?: AuthUser;
  [SCOPE_KEY]?: ReturnType<typeof resolveHierarchyScope>;
}

/**
 * Intercepts every request and attaches a resolved HierarchyScope to the
 * request object so controllers can pass it to query/command handlers.
 *
 * Usage: Apply globally in AppModule or on individual controllers:
 *   @UseInterceptors(HierarchyScopeInterceptor)
 */
@Injectable()
export class HierarchyScopeInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const req = context.switchToHttp().getRequest<RequestWithUser>();

    if (req.user) {
      req[SCOPE_KEY] = await resolveHierarchyScope(req.user, this.prisma);
    }

    return next.handle();
  }
}
