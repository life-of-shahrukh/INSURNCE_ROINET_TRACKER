/**
 * Persists an OrgGraphSeed into OrgMember/OrgEdge/OrgClosure/DistrictChain.
 * Truncate + reinsert inside a caller-supplied transaction so a rebuild is
 * atomic — readers never see a half-built graph.
 */

import type { Prisma } from '@prisma/client';
import type { OrgGraphSeed } from './org-graph-builder';

/** SQL Server caps a statement at 2100 params; chunk createMany well under it. */
const BATCH_SIZE = 300;

export interface OrgGraphCounts {
  members: number;
  edges: number;
  closures: number;
  districtChains: number;
}

async function createInChunks<T>(
  rows: T[],
  insert: (chunk: T[]) => Promise<unknown>,
): Promise<number> {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    await insert(rows.slice(i, i + BATCH_SIZE));
  }
  return rows.length;
}

export async function persistOrgGraph(
  tx: Prisma.TransactionClient,
  seed: OrgGraphSeed,
): Promise<OrgGraphCounts> {
  // Wipe the existing graph (no FKs between these tables, so order is free).
  await tx.districtChain.deleteMany({});
  await tx.orgClosure.deleteMany({});
  await tx.orgEdge.deleteMany({});
  await tx.orgMember.deleteMany({});

  // Members first — ids are DB-generated, so read them back before wiring refs.
  await createInChunks(seed.members, (chunk) =>
    tx.orgMember.createMany({
      data: chunk.map((m) => ({
        userId: m.userId,
        userCode: m.userCode,
        userName: m.userName,
        userType: m.userType,
        role: m.role,
      })),
    }),
  );

  const memberRows = await tx.orgMember.findMany({
    select: { id: true, userId: true },
  });
  const idByUserId = new Map(memberRows.map((r) => [r.userId, r.id]));

  const edgeData = seed.edges
    .map((e) => ({
      memberId: idByUserId.get(e.memberUserId),
      managerId: idByUserId.get(e.managerUserId),
    }))
    .filter(
      (e): e is { memberId: string; managerId: string } =>
        !!e.memberId && !!e.managerId,
    );
  await createInChunks(edgeData, (chunk) =>
    tx.orgEdge.createMany({ data: chunk }),
  );

  const closureData = seed.closures
    .map((c) => ({
      ancestorId: idByUserId.get(c.ancestorUserId),
      descendantId: idByUserId.get(c.descendantUserId),
      depth: c.depth,
    }))
    .filter(
      (c): c is { ancestorId: string; descendantId: string; depth: number } =>
        !!c.ancestorId && !!c.descendantId,
    );
  await createInChunks(closureData, (chunk) =>
    tx.orgClosure.createMany({ data: chunk }),
  );

  const districtChainData = seed.districtChains
    .map((d) => ({
      districtId: d.districtId,
      districtName: d.districtName,
      stateId: d.stateId,
      zoneId: d.zoneId,
      zoneName: d.zoneName,
      regionId: d.regionId,
      regionName: d.regionName,
      memberId: idByUserId.get(d.memberUserId),
      chainLevel: d.chainLevel,
    }))
    .filter(
      (
        d,
      ): d is {
        districtId: string;
        districtName: string | null;
        stateId: string | null;
        zoneId: string | null;
        zoneName: string | null;
        regionId: string | null;
        regionName: string | null;
        memberId: string;
        chainLevel: number;
      } => !!d.memberId,
    );
  await createInChunks(districtChainData, (chunk) =>
    tx.districtChain.createMany({ data: chunk }),
  );

  return {
    members: seed.members.length,
    edges: edgeData.length,
    closures: closureData.length,
    districtChains: districtChainData.length,
  };
}
