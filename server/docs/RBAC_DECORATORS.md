# Role-Based Access Control (RBAC) Decorators

This document provides comprehensive documentation for the role-based access control decorators available in the application.

## Table of Contents

- [Overview](#overview)
- [Available Decorators](#available-decorators)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)

## Overview

The application uses decorators to handle authentication and authorization. The main components are:

- **Decorators**: Define access control rules
- **Guards**: Enforce the rules at runtime
- **User Context**: Provides current user information

### Available Roles

```typescript
export const Role = {
  ADMIN: 'ADMIN',
  POSP: 'POSP',
} as const;
```

## Available Decorators

### 1. `@Roles(...roles: Role[])`

Allows access to users with **at least one** of the specified roles (OR logic).

```typescript
@Roles(Role.ADMIN, Role.POSP)
async findAll() {
  // Both ADMIN and POSP can access
}
```

**When to use**: When multiple roles should have access to the same endpoint.

---

### 2. `@AdminOnly()`

Shorthand decorator for admin-only routes. Equivalent to `@Roles(Role.ADMIN)`.

```typescript
@AdminOnly()
async deleteUser(@Param('id') id: string) {
  // Only ADMIN can access
}
```

**When to use**: For admin-exclusive operations like user management, system configuration.

---

### 3. `@PospOnly()`

Shorthand decorator for POSP-only routes. Equivalent to `@Roles(Role.POSP)`.

```typescript
@PospOnly()
async getMyDeals() {
  // Only POSP can access
}
```

**When to use**: For POSP-specific operations that admins shouldn't access directly.

---

### 4. `@Public()`

Makes a route publicly accessible without authentication.

```typescript
@Public()
async health() {
  // No authentication required
  return { status: 'ok' };
}
```

**When to use**: Health checks, public endpoints, login/signup routes.

**⚠️ Warning**: Use with caution. Ensure no sensitive data is exposed.

---

### 5. `@RequireAllRoles(...roles: Role[])`

Requires user to have **all** specified roles (AND logic).

```typescript
@RequireAllRoles(Role.ADMIN, Role.SUPERVISOR)
async criticalOperation() {
  // User must have BOTH roles
}
```

**When to use**: High-security operations requiring multiple roles.

**Note**: Current system has single-role per user. This is prepared for future multi-role support.

---

### 6. `@AllowAny()`

Allows any authenticated user to access, bypassing role checks.

```typescript
@AllowAny()
async profile(@CurrentUser() user: AuthUser) {
  // Any authenticated user can access
  return user;
}
```

**When to use**: Profile pages, settings, common endpoints for all authenticated users.

---

### 7. `@CurrentUser()`

Parameter decorator to inject the current authenticated user.

```typescript
async updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateDto) {
  return this.service.update(user.userId, dto);
}
```

**Returns**: `AuthUser` object with:
- `userId: string`
- `email: string`
- `role: Role`
- `status: UserStatus`
- `pospId?: string`

---

## Usage Examples

### Example 1: Controller with Mixed Access

```typescript
@Controller('api/deals')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DealController {
  constructor(private readonly dealService: DealService) {}

  // All authenticated users can list deals (filtered by their access level)
  @Get()
  @Roles(Role.ADMIN, Role.POSP)
  findAll(@CurrentUser() user: AuthUser) {
    return this.dealService.getAll(user);
  }

  // Both roles can create, logic handles differently
  @Post()
  @Roles(Role.ADMIN, Role.POSP)
  create(@Body() dto: CreateDealDto, @CurrentUser() user: AuthUser) {
    return this.dealService.create(dto, user);
  }

  // Only admin can delete
  @Delete(':id')
  @AdminOnly()
  delete(@Param('id') id: string) {
    return this.dealService.delete(id);
  }
}
```

### Example 2: Public Authentication Endpoints

```typescript
@Controller('api/auth')
export class AuthController {
  // Public endpoints don't need guards
  @Post('login')
  @Public()
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('signup')
  @Public()
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  // Protected endpoint for authenticated users
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return this.authService.getProfile(user);
  }

  // Admin-only endpoint
  @Patch('users/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  updateUserStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.authService.updateStatus(id, dto);
  }
}
```

### Example 3: Controller-Level Protection

```typescript
// All routes in this controller require ADMIN role
@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
@ApiBearerAuth()
export class AdminController {
  @Get('users')
  listUsers() {
    return this.adminService.listUsers();
  }

  @Get('analytics')
  getAnalytics() {
    return this.adminService.getAnalytics();
  }

  @Post('system/config')
  updateConfig(@Body() dto: ConfigDto) {
    return this.adminService.updateConfig(dto);
  }
}
```

## Best Practices

### 1. Always Use Guards with Role Decorators

```typescript
// ✅ GOOD
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
async adminRoute() { }

// ❌ BAD - Decorator without guard won't work
@Roles(Role.ADMIN)
async adminRoute() { }
```

### 2. Order Matters

```typescript
// ✅ GOOD - Guards before decorators
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
async route() { }

// Still works but less conventional
@AdminOnly()
@UseGuards(JwtAuthGuard, RolesGuard)
async route() { }
```

### 3. Use Controller-Level Guards for Consistency

```typescript
// ✅ GOOD - Guards at controller level
@Controller('api/resource')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ResourceController {
  @AdminOnly()
  create() { }

  @AdminOnly()
  delete() { }
}
```

### 4. Mark Public Routes Explicitly

```typescript
// ✅ GOOD - Clear intent
@Post('login')
@Public()
login(@Body() dto: LoginDto) { }

// ❌ BAD - Unclear if intentionally public or missing guard
@Post('login')
login(@Body() dto: LoginDto) { }
```

### 5. Use Shorthand Decorators for Clarity

```typescript
// ✅ GOOD - Clear and concise
@AdminOnly()

// Less clear
@Roles(Role.ADMIN)

// ✅ GOOD - Shows intent to allow multiple roles
@Roles(Role.ADMIN, Role.POSP)
```

## Common Patterns

### Pattern 1: Protected Controller with Public Exceptions

```typescript
@Controller('api/resource')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ResourceController {
  // Most routes are protected
  @Get()
  @Roles(Role.ADMIN, Role.POSP)
  findAll() { }

  // Except this one
  @Get('public-info')
  @Public()
  getPublicInfo() { }
}
```

### Pattern 2: Different Access Levels

```typescript
@Controller('api/data')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DataController {
  // Anyone authenticated can read
  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAll(user);
  }

  // Only ADMIN can create
  @Post()
  @AdminOnly()
  create(@Body() dto: CreateDto) {
    return this.service.create(dto);
  }

  // Only ADMIN can delete
  @Delete(':id')
  @AdminOnly()
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
```

### Pattern 3: Role-Based Logic in Service

```typescript
@Controller('api/deals')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.POSP)
export class DealController {
  // Decorator allows both roles, service handles logic
  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    // Service filters based on role:
    // - ADMIN sees all deals
    // - POSP sees only their deals
    return this.dealService.findAll(user);
  }
}
```

## Security Considerations

1. **Never expose sensitive data in public routes**
2. **Always validate user ownership in services** - decorators only check roles, not ownership
3. **Use HTTPS in production** - JWT tokens are bearer tokens
4. **Implement rate limiting** on public endpoints
5. **Log authorization failures** for security monitoring

## Testing Role-Based Access

```typescript
describe('DealController', () => {
  it('should allow ADMIN to access all deals', async () => {
    const adminUser: AuthUser = {
      userId: '1',
      email: 'admin@example.com',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    };
    // Test implementation
  });

  it('should deny POSP from deleting deals', async () => {
    const pospUser: AuthUser = {
      userId: '2',
      email: 'posp@example.com',
      role: Role.POSP,
      status: UserStatus.ACTIVE,
      pospId: 'posp-1',
    };
    // Test should throw ForbiddenException
  });
});
```
