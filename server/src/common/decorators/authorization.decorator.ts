import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to check if user owns the resource (e.g., POSP accessing their own data).
 * Used in combination with authorization logic in services.
 *
 * @example
 * @CheckOwnership('pospId')
 * async updatePosp(@Param('id') id: string) { ... }
 */
export const CHECK_OWNERSHIP_KEY = 'checkOwnership';
export const CheckOwnership = (paramName: string = 'id') =>
  SetMetadata(CHECK_OWNERSHIP_KEY, paramName);

/**
 * Decorator to bypass role checks for a specific route while keeping authentication.
 * Useful for routes where all authenticated users can access.
 *
 * @example
 * @AllowAny()
 * @UseGuards(JwtAuthGuard)
 * async profile() { ... }
 */
export const ALLOW_ANY_KEY = 'allowAny';
export const AllowAny = () => SetMetadata(ALLOW_ANY_KEY, true);
