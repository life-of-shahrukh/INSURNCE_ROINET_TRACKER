import type { Posp, Prisma } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import {
  inactivityThresholdDate,
  isPospActiveByDealActivity,
  resolveLastBusinessAt,
} from './posp-activity.util';

export type PospWithComputedActivity = Posp & {
  active: boolean;
  lastBusinessAt: Date | null;
  autoInactive: boolean;
  dealCount?: number;
  premiumTotal?: number;
};

export interface PospDealStats {
  dealCount: number;
  premiumTotal: number;
}

/** Prisma filter: POSPs considered active under the 30-day deal rule */
export function pospActiveWhere(now: Date = new Date()): Prisma.PospWhereInput {
  const threshold = inactivityThresholdDate(now);
  return {
    OR: [
      { deals: { some: { createdAt: { gte: threshold } } } },
      {
        deals: { none: {} },
        joined: { gte: threshold },
      },
    ],
  };
}

/** Prisma filter: POSPs considered inactive under the 30-day deal rule */
export function pospInactiveWhere(
  now: Date = new Date(),
): Prisma.PospWhereInput {
  const threshold = inactivityThresholdDate(now);
  return {
    OR: [
      {
        deals: { some: {} },
        NOT: { deals: { some: { createdAt: { gte: threshold } } } },
      },
      {
        deals: { none: {} },
        joined: { lt: threshold },
      },
    ],
  };
}

export async function fetchLastDealDatesByPospId(
  prisma: PrismaService,
  pospIds: string[],
): Promise<Map<string, Date>> {
  if (pospIds.length === 0) return new Map();

  const rows = await prisma.deal.groupBy({
    by: ['pospId'],
    where: { pospId: { in: pospIds } },
    _max: { createdAt: true },
  });

  const map = new Map<string, Date>();
  for (const row of rows) {
    if (row.pospId && row._max.createdAt) {
      map.set(row.pospId, row._max.createdAt);
    }
  }
  return map;
}

export async function fetchDealStatsByPospId(
  prisma: PrismaService,
  pospIds: string[],
): Promise<Map<string, PospDealStats>> {
  if (pospIds.length === 0) return new Map();

  const rows = await prisma.deal.groupBy({
    by: ['pospId'],
    where: { pospId: { in: pospIds } },
    _count: { _all: true },
    _sum: { premium: true },
  });

  const map = new Map<string, PospDealStats>();
  for (const row of rows) {
    if (row.pospId) {
      map.set(row.pospId, {
        dealCount: row._count._all,
        premiumTotal: row._sum.premium ?? 0,
      });
    }
  }
  return map;
}

export function attachDealStatsToPosps<T extends { id: string }>(
  posps: T[],
  statsMap: Map<string, PospDealStats>,
): Array<T & PospDealStats> {
  return posps.map((posp) => {
    const stats = statsMap.get(posp.id);
    return {
      ...posp,
      dealCount: stats?.dealCount ?? 0,
      premiumTotal: stats?.premiumTotal ?? 0,
    };
  });
}

export function applyComputedPospActivity(
  posp: Posp,
  lastDealAt: Date | null | undefined,
  now: Date = new Date(),
): PospWithComputedActivity {
  const lastBusinessAt = resolveLastBusinessAt(lastDealAt, posp.lastBusinessAt);
  const active = isPospActiveByDealActivity(lastBusinessAt, {
    joined: posp.joined,
    now,
  });
  return {
    ...posp,
    active,
    lastBusinessAt,
    autoInactive: !active,
  };
}

export async function enrichPospsWithActivity(
  prisma: PrismaService,
  posps: Posp[],
  now: Date = new Date(),
): Promise<PospWithComputedActivity[]> {
  if (posps.length === 0) return [];

  const lastDealMap = await fetchLastDealDatesByPospId(
    prisma,
    posps.map((p) => p.id),
  );

  return posps.map((posp) =>
    applyComputedPospActivity(posp, lastDealMap.get(posp.id), now),
  );
}
