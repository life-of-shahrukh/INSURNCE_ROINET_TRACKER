import type { PrismaService } from '../../prisma/prisma.service';

export interface DistrictOwner {
  /** Cognitensor UserId — matches manager node ids in the sales-team org chart. */
  userId: string;
  /** Cognitensor UserCode — matches manager node ids in the hierarchy org chart. */
  userCode: string;
  districtName: string | null;
}

export interface PospChartRow {
  id: string;
  externalId: string | null;
  name: string;
  code: string;
  districtId: string;
}

/** districtId -> district owner (chainLevel 0) from the persisted org graph. */
export async function loadDistrictOwnersByDistrictId(
  prisma: PrismaService,
): Promise<Map<string, DistrictOwner>> {
  const chains = await prisma.districtChain.findMany({
    where: { chainLevel: 0 },
    select: { districtId: true, districtName: true, memberId: true },
  });
  if (chains.length === 0) return new Map();

  const memberIds = [...new Set(chains.map((c) => c.memberId))];
  const members = await prisma.orgMember.findMany({
    where: { id: { in: memberIds } },
    select: { id: true, userId: true, userCode: true },
  });
  const memberById = new Map(members.map((m) => [m.id, m]));

  const map = new Map<string, DistrictOwner>();
  for (const c of chains) {
    const member = memberById.get(c.memberId);
    if (!member) continue;
    map.set(c.districtId, {
      userId: member.userId,
      userCode: member.userCode,
      districtName: c.districtName,
    });
  }
  return map;
}

/** Active POSPs with a district assignment — the leaf nodes of the org chart. */
export async function loadPospsForOrgChart(
  prisma: PrismaService,
  districtIds?: string[],
): Promise<PospChartRow[]> {
  const rows = await prisma.posp.findMany({
    where: {
      districtId: districtIds?.length ? { in: districtIds } : { not: null },
      active: true,
    },
    select: {
      id: true,
      externalId: true,
      name: true,
      code: true,
      districtId: true,
    },
    orderBy: { name: 'asc' },
  });
  return rows.filter(
    (r): r is PospChartRow & { districtId: string } => !!r.districtId,
  );
}
