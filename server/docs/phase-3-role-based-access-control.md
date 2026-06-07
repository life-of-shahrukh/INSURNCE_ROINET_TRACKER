# Phase 3: Role-Based Access Control

**Implementation Date**: June 6-7, 2026  
**Status**: ✅ Completed  
**Developer(s)**: Development Team

## Overview

This phase implements a comprehensive Role-Based Access Control (RBAC) system using custom decorators and guards. The system provides fine-grained access control at the route level while maintaining clean, readable controller code.

## Goals

- ✅ Create flexible role decorators for access control
- ✅ Implement enhanced RolesGuard with validation and logging
- ✅ Add support for public routes
- ✅ Improve error messages and logging
- ✅ Update all controllers with proper role protection
- ✅ Create comprehensive RBAC documentation

## Architecture Overview

```
┌──────────────┐
│  Controller  │
│  @Roles(...)  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ RolesGuard   │  ← Validates roles
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Handler    │
└──────────────┘
```

## Role System

### Available Roles

```typescript
export const Role = {
  ADMIN: 'ADMIN',
  POSP: 'POSP',
} as const;

export type Role = (typeof Role)[keyof typeof Role];
```

### User Status

```typescript
export const UserStatus = {
  PENDING: 'PENDING',   // Awaiting approval
  ACTIVE: 'ACTIVE',     // Can access system
  INACTIVE: 'INACTIVE', // Blocked
} as const;
```

Only users with `ACTIVE` status can access protected routes.

## Decorator Implementation

### 1. @Roles Decorator

Main decorator for role-based access control.

```typescript
// roles.decorator.ts
export const ROLES_KEY = 'roles';

export const Roles = (...roles: Role[]) => 
  SetMetadata(ROLES_KEY, roles);
```

**Usage**:
```typescript
// Single role
@Roles(Role.ADMIN)
async adminOnly() { }

// Multiple roles (OR logic - needs at least one)
@Roles(Role.ADMIN, Role.POSP)
async adminOrPosp() { }
```

### 2. @Public Decorator

Makes routes publicly accessible (no authentication).

```typescript
export const PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(PUBLIC_KEY, true);
```

**Usage**:
```typescript
@Public()
@Post('login')
async login(@Body() dto: LoginDto) { }
```

### 3. @CurrentUser Decorator

Parameter decorator to inject authenticated user.

```typescript
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

**Usage**:
```typescript
@Get()
async profile(@CurrentUser() user: AuthUser) {
  return user;
}
```

### Additional Decorators

#### @RequireAllRoles (Future Use)
For AND logic - user must have ALL roles.

```typescript
@RequireAllRoles(Role.ADMIN, Role.SUPERVISOR)
async criticalOperation() { }
```

#### @AdminOnly / @PospOnly (Convenience)
Shorthand decorators (optional - explicit @Roles preferred).

```typescript
@AdminOnly()  // Same as @Roles(Role.ADMIN)
@PospOnly()   // Same as @Roles(Role.POSP)
```

#### @AllowAny
Any authenticated user (no role check).

```typescript
@AllowAny()
@UseGuards(JwtAuthGuard)
async settings() { }
```

## RolesGuard Implementation

Enhanced guard with validation, logging, and error handling.

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) return true;

    // 2. Get required roles
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 3. No roles = any authenticated user
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 4. Get user from request
    const req = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = req.user;

    if (!user) {
      this.logger.warn('No user found in request');
      throw new ForbiddenException('Authentication required');
    }

    // 5. Check user status
    if (user.status !== 'ACTIVE') {
      this.logger.warn(
        `User ${user.email} with status ${user.status} attempted access`,
      );
      throw new ForbiddenException('Account is not active');
    }

    // 6. Check role
    const hasAccess = requiredRoles.includes(user.role);

    if (!hasAccess) {
      this.logger.warn(
        `User ${user.email} (${user.role}) attempted to access route requiring: ${requiredRoles.join(', ')}`,
      );
      throw new ForbiddenException(
        `Insufficient permissions. Required role: ${requiredRoles.join(' or ')}`,
      );
    }

    return true;
  }
}
```

### Guard Features

✅ **Public Route Support**: Routes marked `@Public()` bypass all checks  
✅ **User Status Validation**: Only ACTIVE users can access  
✅ **Detailed Logging**: All authorization failures are logged  
✅ **Clear Error Messages**: Specific messages for debugging  
✅ **Role Hierarchy Support**: Ready for future role extensions  
✅ **Context-aware**: Works at controller and route level  

## Controller Patterns

### Pattern 1: Mixed Access Controller

```typescript
@Controller('api/deals')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.POSP)
@ApiBearerAuth()
export class DealController {
  // Inherited from controller - both roles
  @Get()
  findAll(@CurrentUser() user: AuthUser) { }

  // Both roles can create
  @Post()
  create(@Body() dto: CreateDealDto, @CurrentUser() user: AuthUser) { }

  // Override - admin only
  @Delete(':id')
  @Roles(Role.ADMIN)
  delete(@Param('id') id: string) { }
}
```

### Pattern 2: Public Auth Controller

```typescript
@Controller('api/auth')
export class AuthController {
  // Public routes
  @Post('login')
  @Public()
  login(@Body() dto: LoginDto) { }

  @Post('signup')
  @Public()
  signup(@Body() dto: SignupDto) { }

  // Protected route
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser) { }

  // Admin-only route
  @Patch('approve/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  approve(@Param('id') id: string) { }
}
```

### Pattern 3: Admin-Only Controller

```typescript
@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class AdminController {
  // All routes require ADMIN
  @Get('users')
  listUsers() { }

  @Get('analytics')
  getAnalytics() { }

  @Post('config')
  updateConfig(@Body() dto: ConfigDto) { }
}
```

## Updated Controllers

### AuthController
```typescript
✅ login - @Public()
✅ signup-posp - @Public()
✅ me - Any authenticated user
✅ approve-posp - @Roles(Role.ADMIN)
```

### PospController
```typescript
✅ Controller level - @Roles(Role.ADMIN, Role.POSP)
✅ GET / - Inherited (both roles)
✅ POST / - @Roles(Role.ADMIN) (admin only)
✅ PATCH /:id - Inherited (both roles)
```

### DealController
```typescript
✅ Controller level - @Roles(Role.ADMIN, Role.POSP)
✅ All routes - Both roles, logic filters data by role
```

## Authorization Flow

```
1. Request arrives
   ↓
2. JwtAuthGuard validates JWT
   ↓
3. User attached to request
   ↓
4. RolesGuard checks:
   - Is route public? → Allow
   - User exists? → Reject if not
   - User active? → Reject if not
   - Has required role? → Allow/Reject
   ↓
5. Request reaches handler
```

## Error Responses

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```
**Cause**: No JWT token or invalid token

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions. Required role: ADMIN"
}
```
**Cause**: User doesn't have required role

```json
{
  "statusCode": 403,
  "message": "Account is not active"
}
```
**Cause**: User status is not ACTIVE

```json
{
  "statusCode": 403,
  "message": "Authentication required"
}
```
**Cause**: Protected route accessed without authentication

## Testing

### Unit Testing RolesGuard

```typescript
describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should allow public routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(true); // isPublic

    const context = createMockContext();
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should reject inactive users', () => {
    const user: AuthUser = {
      userId: '1',
      email: 'test@example.com',
      role: Role.ADMIN,
      status: UserStatus.INACTIVE,
    };

    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false) // isPublic
      .mockReturnValueOnce([Role.ADMIN]); // requiredRoles

    const context = createMockContext(user);

    expect(() => guard.canActivate(context))
      .toThrow(ForbiddenException);
  });

  it('should allow user with correct role', () => {
    const user: AuthUser = {
      userId: '1',
      email: 'admin@example.com',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    };

    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false) // isPublic
      .mockReturnValueOnce([Role.ADMIN]); // requiredRoles

    const context = createMockContext(user);

    expect(guard.canActivate(context)).toBe(true);
  });
});
```

### Integration Testing

```typescript
describe('Protected Route', () => {
  it('should return 403 for POSP accessing admin route', async () => {
    const token = await getTokenForPosp();

    return request(app.getHttpServer())
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('should allow ADMIN to access admin route', async () => {
    const token = await getTokenForAdmin();

    return request(app.getHttpServer())
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
```

## Security Best Practices

### 1. Always Use Guards with Role Decorators
```typescript
// ✅ GOOD
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)

// ❌ BAD - Decorator without guard won't work
@Roles(Role.ADMIN)
```

### 2. Controller-Level Guards for Consistency
```typescript
// ✅ GOOD - Guards at controller level
@Controller('api/resource')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResourceController { }
```

### 3. Explicit Public Routes
```typescript
// ✅ GOOD - Clear intent
@Public()
@Post('login')

// ❌ BAD - Unclear if intentionally public
@Post('login')
```

### 4. Check Ownership in Service Layer
```typescript
// Decorator only checks role, not ownership
@Roles(Role.POSP)
@Patch(':id')
async update(@Param('id') id: string, @CurrentUser() user: AuthUser) {
  // Service checks if POSP owns this resource
  return this.service.update(id, dto, user);
}
```

## Logging & Monitoring

### Authorization Failures
All authorization failures are logged:
```
[RolesGuard] User posp@example.com (POSP) attempted to access route requiring: ADMIN
```

### Usage Patterns
Monitor logs to:
- Detect unauthorized access attempts
- Identify misconfigured routes
- Track role usage patterns
- Find security issues

### Recommended Setup
```typescript
// Add to app.module.ts
providers: [
  {
    provide: APP_GUARD,
    useClass: RolesGuard,
  },
],
```
This makes RolesGuard global (still need decorators).

## Common Issues & Solutions

### Issue 1: Guard Not Working
**Symptom**: Routes accessible without proper role  
**Solution**: Ensure guards are registered:
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
```

### Issue 2: Always Getting 403
**Symptom**: Admin user getting 403  
**Solution**: Check user status is ACTIVE, not PENDING

### Issue 3: Public Route Requiring Auth
**Symptom**: Login endpoint requires auth  
**Solution**: Add `@Public()` decorator

### Issue 4: Wrong Error Message
**Symptom**: Generic "Unauthorized" instead of specific message  
**Solution**: Ensure RolesGuard comes after JwtAuthGuard

## Future Enhancements

### Immediate
- [ ] Add permission-based access (beyond roles)
- [ ] Implement resource ownership checks
- [ ] Add IP-based restrictions

### Short-term
- [ ] Role hierarchy (SUPER_ADMIN > ADMIN > POSP)
- [ ] Time-based access (business hours only)
- [ ] Multi-factor authentication requirement

### Long-term
- [ ] Fine-grained permissions system
- [ ] Attribute-based access control (ABAC)
- [ ] Dynamic role assignment
- [ ] Role delegation/impersonation

## Documentation Created

### RBAC_DECORATORS.md
Comprehensive guide including:
- All available decorators
- Usage examples
- Best practices
- Common patterns
- Testing strategies
- Security considerations

### Example Controller
Created `example-roles.controller.ts` demonstrating:
- All decorator usage patterns
- Common controller patterns
- Best practices

## API Endpoints Summary

### Public Endpoints (No Auth)
```
POST   /api/auth/login
POST   /api/auth/signup-posp
```

### Authenticated Endpoints (Any Active User)
```
GET    /api/auth/me
```

### Admin Only
```
PATCH  /api/auth/approve-posp/:userId
POST   /api/posp
```

### Admin or POSP
```
GET    /api/posp
PATCH  /api/posp/:id
GET    /api/deals
GET    /api/deals/export
POST   /api/deals
PATCH  /api/deals/:id
DELETE /api/deals/:id
```

## Lessons Learned

1. **Explicit is Better**: `@Roles(Role.ADMIN)` more maintainable than `@AdminOnly()`
2. **Log Everything**: Authorization failures must be logged for security
3. **Status Matters**: Role alone isn't enough - status must be ACTIVE
4. **Clear Errors**: Specific error messages help debugging
5. **Context-Aware**: Guards work at both controller and route level

## Resources

- [NestJS Guards](https://docs.nestjs.com/guards)
- [NestJS Custom Decorators](https://docs.nestjs.com/custom-decorators)
- [OWASP Access Control](https://owasp.org/www-project-top-ten/2017/A5_2017-Broken_Access_Control)

---

**Phase Status**: ✅ Completed and In Production  
**Previous Phase**: [Phase 2 - CQRS & Event-Driven Architecture](./phase-2-cqrs-event-driven-architecture.md)  
**Next Phase**: Phase 4 - Frontend Development (Upcoming)
