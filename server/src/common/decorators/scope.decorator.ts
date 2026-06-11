import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user.interface';
import type { HierarchyScope } from '../auth/hierarchy-scope.util';

/**
 * Metadata key for carrying a pre-resolved HierarchyScope on the request object.
 * The scope is attached by the HierarchyScopeInterceptor.
 */
export const SCOPE_KEY = '_hierarchyScope';

/**
 * Parameter decorator that extracts the pre-resolved HierarchyScope from the
 * request object (set by HierarchyScopeInterceptor).
 *
 * Usage in controllers:
 *   findAll(@CurrentUser() user: AuthUser, @ResolvedScope() scope: HierarchyScope)
 */
export const ResolvedScope = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): HierarchyScope | undefined => {
    const req = ctx.switchToHttp().getRequest<{
      user?: AuthUser;
      [SCOPE_KEY]?: HierarchyScope;
    }>();
    return req[SCOPE_KEY] ?? undefined;
  },
);
