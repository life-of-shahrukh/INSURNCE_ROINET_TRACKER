import * as fs from 'fs';
import * as path from 'path';
import type { PrismaClient } from '@prisma/client';

/** Row shape from Cognitensor ListDistrict snapshot. */
export interface DistrictSnapshotRow {
  StateId: string;
  DistrictId: string;
  DistrictName: string;
  zoneid?: string;
  zonename?: string;
  regionid?: string;
  regionname?: string;
}

/** Geo fields stored on Customer / Lead / Deal for Cognitensor-aligned filtering. */
export interface GeoFields {
  stateId: string;
  stateName: string | null;
  districtId: string;
  districtName: string | null;
  zoneId: string | null;
  regionId: string | null;
}

const SNAPSHOT_DIR = path.join(__dirname, '../../data/snapshots');

export function readDistrictSnapshot(): DistrictSnapshotRow[] {
  const file = path.join(SNAPSHOT_DIR, 'districts-sample.json');
  const raw = fs.readFileSync(file, 'utf-8').replace(/^\uFEFF/, '');
  const parsed = JSON.parse(raw) as { Data: DistrictSnapshotRow[] };
  return parsed.Data;
}

export function buildDistrictGeoMap(
  rows: DistrictSnapshotRow[],
): Map<string, DistrictSnapshotRow> {
  const map = new Map<string, DistrictSnapshotRow>();
  for (const row of rows) {
    if (row.DistrictId) map.set(row.DistrictId, row);
  }
  return map;
}

export function geoForDistrict(
  districtId: string,
  districtMap: Map<string, DistrictSnapshotRow>,
): GeoFields | null {
  const row = districtMap.get(districtId);
  if (!row) return null;
  return {
    stateId: row.StateId,
    stateName: null,
    districtId: row.DistrictId,
    districtName: row.DistrictName ?? null,
    zoneId: row.zoneid ?? null,
    regionId: row.regionid ?? null,
  };
}

/** districtId -> SalesTeam.id for the district owner (chainLevel 0). */
export async function loadDistrictOwnerSalesTeamMap(
  prisma: PrismaClient,
): Promise<Map<string, string>> {
  const chains = await prisma.districtChain.findMany({
    where: { chainLevel: 0 },
    select: { districtId: true, memberId: true },
  });
  if (chains.length === 0) return new Map();

  const memberIds = [...new Set(chains.map((c) => c.memberId))];
  const members = await prisma.orgMember.findMany({
    where: { id: { in: memberIds } },
    select: { id: true, userCode: true },
  });
  const codeByMemberId = new Map(members.map((m) => [m.id, m.userCode]));

  const codes = [...new Set(members.map((m) => m.userCode))];
  const salesTeams = await prisma.salesTeam.findMany({
    where: { employeeCode: { in: codes } },
    select: { id: true, employeeCode: true },
  });
  const salesTeamByCode = new Map(
    salesTeams.map((st) => [st.employeeCode, st.id]),
  );

  const map = new Map<string, string>();
  for (const chain of chains) {
    const code = codeByMemberId.get(chain.memberId);
    if (!code) continue;
    const salesTeamId = salesTeamByCode.get(code);
    if (salesTeamId) map.set(chain.districtId, salesTeamId);
  }
  return map;
}

/** StateId -> StateName from states snapshot (optional enrichment). */
export function readStateNameMap(): Map<string, string> {
  const file = path.join(SNAPSHOT_DIR, 'states.json');
  try {
    const raw = fs.readFileSync(file, 'utf-8').replace(/^\uFEFF/, '');
    const parsed = JSON.parse(raw) as {
      Data: Array<{ StateId: string; StateName: string }>;
    };
    return new Map(parsed.Data.map((s) => [s.StateId, s.StateName]));
  } catch {
    return new Map();
  }
}

export function enrichGeoWithStateName(
  geo: GeoFields,
  stateNames: Map<string, string>,
): GeoFields {
  return {
    ...geo,
    stateName: stateNames.get(geo.stateId) ?? geo.stateName,
  };
}
