/**
 * Unit tests for hierarchy scope resolution and filter utilities.
 * Tests data visibility rules for all 7 roles.
 */

import {
  resolveHierarchyScope,
  buildDealScopeWhere,
  buildPospScopeWhere,
  type HierarchyScope,
} from '../../../src/common/auth/hierarchy-scope.util';
import { Role, UserStatus } from '../../../src/common/constants';
import type { AuthUser } from '../../../src/common/auth/auth-user.interface';

// ── Helpers ──────────────────────────────────────────────────────────────────

function mockUser(role: Role, extra: Partial<AuthUser> = {}): AuthUser {
  return {
    userId: 'user-1',
    email: 'test@example.com',
    role,
    status: UserStatus.ACTIVE,
    ...extra,
  };
}

/** Minimal Prisma mock that simulates the database */
function makePrismaMock(overrides: Record<string, unknown> = {}): unknown {
  return {
    salesTeam: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'st-1',
        zoneId: 'zone-north',
        regionId: 'region-delhi',
        areaId: 'area-central',
        districtId: 'district-cp',
      }),
    },
    posp: {
      findMany: jest
        .fn()
        .mockResolvedValue([
          { id: 'posp-1' },
          { id: 'posp-2' },
          { id: 'posp-3' },
        ]),
    },
    ...overrides,
  };
}

// ── resolveHierarchyScope ────────────────────────────────────────────────────

describe('resolveHierarchyScope', () => {
  it('SUPER_ADMIN gets empty scope (all data)', async () => {
    const user = mockUser(Role.SUPER_ADMIN);
    const prisma = makePrismaMock() as never;
    const scope = await resolveHierarchyScope(user, prisma);
    expect(scope).toEqual({});
  });

  it('NATIONAL_HEAD gets empty scope (all data)', async () => {
    const user = mockUser(Role.NATIONAL_HEAD);
    const prisma = makePrismaMock() as never;
    const scope = await resolveHierarchyScope(user, prisma);
    expect(scope).toEqual({});
  });

  it('POSP gets own pospId in scope', async () => {
    const user = mockUser(Role.POSP, { pospId: 'my-posp-id' });
    const prisma = makePrismaMock() as never;
    const scope = await resolveHierarchyScope(user, prisma);
    expect(scope).toEqual({ pospIds: ['my-posp-id'] });
  });

  it('POSP without pospId throws ForbiddenException', async () => {
    const user = mockUser(Role.POSP);
    const prisma = makePrismaMock() as never;
    await expect(resolveHierarchyScope(user, prisma)).rejects.toThrow(
      'not linked',
    );
  });

  it('ZH gets zoneIds from SalesTeam record', async () => {
    const user = mockUser(Role.ZH);
    const prisma = makePrismaMock() as never;
    const scope = await resolveHierarchyScope(user, prisma);
    expect(scope).toEqual({ zoneIds: ['zone-north'] });
  });

  it('RH gets regionIds from SalesTeam record', async () => {
    const user = mockUser(Role.RH);
    const prisma = makePrismaMock() as never;
    const scope = await resolveHierarchyScope(user, prisma);
    expect(scope).toEqual({ regionIds: ['region-delhi'] });
  });

  it('ASM gets pospIds of managed POSPs', async () => {
    const user = mockUser(Role.ASM);
    const prisma = makePrismaMock() as never;
    const scope = await resolveHierarchyScope(user, prisma);
    expect(scope).toEqual({ pospIds: ['posp-1', 'posp-2', 'posp-3'] });
  });

  it('DM gets pospIds in their district', async () => {
    const user = mockUser(Role.DM);
    const prisma = makePrismaMock() as never;
    const scope = await resolveHierarchyScope(user, prisma);
    expect(scope.pospIds).toBeDefined();
    expect(Array.isArray(scope.pospIds)).toBe(true);
  });

  it('ZH/RH/ASM/DM with no SalesTeam record get no access', async () => {
    const user = mockUser(Role.ZH);
    const prisma = makePrismaMock({
      salesTeam: { findUnique: jest.fn().mockResolvedValue(null) },
    }) as never;
    const scope = await resolveHierarchyScope(user, prisma);
    expect(scope).toEqual({ pospIds: [] });
  });
});

// ── buildDealScopeWhere ──────────────────────────────────────────────────────

describe('buildDealScopeWhere', () => {
  it('empty scope returns empty where clause', () => {
    expect(buildDealScopeWhere({})).toEqual({});
  });

  it('pospIds scope filters by pospId', () => {
    const scope: HierarchyScope = { pospIds: ['p1', 'p2'] };
    expect(buildDealScopeWhere(scope)).toEqual({
      pospId: { in: ['p1', 'p2'] },
    });
  });

  it('zoneIds scope filters by zoneId', () => {
    const scope: HierarchyScope = { zoneIds: ['z1'] };
    expect(buildDealScopeWhere(scope)).toEqual({ zoneId: { in: ['z1'] } });
  });

  it('regionIds scope filters by regionId', () => {
    const scope: HierarchyScope = { regionIds: ['r1', 'r2'] };
    expect(buildDealScopeWhere(scope)).toEqual({
      regionId: { in: ['r1', 'r2'] },
    });
  });

  it('pospIds takes priority over zoneIds', () => {
    const scope: HierarchyScope = { pospIds: ['p1'], zoneIds: ['z1'] };
    const where = buildDealScopeWhere(scope);
    expect(where).toHaveProperty('pospId');
    expect(where).not.toHaveProperty('zoneId');
  });

  it('empty pospIds array returns empty pospId filter (no access)', () => {
    const scope: HierarchyScope = { pospIds: [] };
    expect(buildDealScopeWhere(scope)).toEqual({ pospId: { in: [] } });
  });
});

// ── buildPospScopeWhere ──────────────────────────────────────────────────────

describe('buildPospScopeWhere', () => {
  it('empty scope returns empty where clause', () => {
    expect(buildPospScopeWhere({})).toEqual({});
  });

  it('pospIds scope filters by id', () => {
    const scope: HierarchyScope = { pospIds: ['p1', 'p2'] };
    expect(buildPospScopeWhere(scope)).toEqual({ id: { in: ['p1', 'p2'] } });
  });

  it('zoneIds scope filters by zoneId on Posp', () => {
    const scope: HierarchyScope = { zoneIds: ['z-north'] };
    expect(buildPospScopeWhere(scope)).toEqual({ zoneId: { in: ['z-north'] } });
  });
});

// ── Role visibility matrix (documented expectations) ─────────────────────────

describe('Role Data Access Matrix', () => {
  const roles: Role[] = [
    Role.SUPER_ADMIN,
    Role.NATIONAL_HEAD,
    Role.ZH,
    Role.RH,
    Role.ASM,
    Role.DM,
    Role.POSP,
  ];

  const prismaWithSalesTeam = makePrismaMock() as never;

  it.each(roles)('%s resolves a valid scope without throwing', async (role) => {
    const user = mockUser(
      role,
      role === Role.POSP ? { pospId: 'test-posp' } : {},
    );
    const scope = await resolveHierarchyScope(user, prismaWithSalesTeam);
    expect(scope).toBeDefined();
  });

  it('SUPER_ADMIN sees all deals (no where clause)', () => {
    const where = buildDealScopeWhere({});
    expect(Object.keys(where).length).toBe(0);
  });

  it('POSP sees only their deals', () => {
    const where = buildDealScopeWhere({ pospIds: ['posp-abc'] });
    expect(where).toEqual({ pospId: { in: ['posp-abc'] } });
  });
});
