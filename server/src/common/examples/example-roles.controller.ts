import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import {
  Roles,
  AdminOnly,
  PospOnly,
  Public,
  AllowAny,
  CurrentUser,
} from '../decorators';
import { Role } from '../constants';
import { AuthUser } from '../auth/auth-user.interface';

/**
 * Example controller demonstrating role decorator usage.
 * This is a reference implementation - not part of the actual API.
 */
@Controller('example')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExampleRolesController {
  /**
   * Route accessible by any authenticated user (no role check)
   */
  @Get('authenticated')
  anyAuthenticatedUser(@CurrentUser() user: AuthUser) {
    return { message: 'Any authenticated user can access', user };
  }

  /**
   * Route accessible by ADMIN or POSP (OR logic - needs at least one role)
   */
  @Get('admin-or-posp')
  @Roles(Role.SUPER_ADMIN, Role.POSP)
  adminOrPosp(@CurrentUser() user: AuthUser) {
    return { message: 'Super Admin or POSP can access', role: user.role };
  }

  /**
   * Route accessible only by ADMIN
   */
  @Get('admin-only')
  @AdminOnly()
  adminOnly(@CurrentUser() user: AuthUser) {
    return { message: 'Only admin can access', user };
  }

  /**
   * Route accessible only by POSP
   */
  @Get('posp-only')
  @PospOnly()
  pospOnly(@CurrentUser() user: AuthUser) {
    return { message: 'Only POSP can access', user };
  }

  /**
   * Public route (no authentication required)
   */
  @Get('public')
  @Public()
  publicRoute() {
    return { message: 'Public route - no authentication required' };
  }

  /**
   * Route that explicitly allows any authenticated user
   * (Alternative to not specifying any role decorator)
   */
  @Get('allow-any')
  @AllowAny()
  allowAny(@CurrentUser() user: AuthUser) {
    return { message: 'Any authenticated user allowed', user };
  }

  /**
   * Protected POST endpoint - only admin can create
   */
  @Post('create')
  @AdminOnly()
  create(@CurrentUser() user: AuthUser) {
    return { message: 'Resource created by admin', adminId: user.userId };
  }
}
