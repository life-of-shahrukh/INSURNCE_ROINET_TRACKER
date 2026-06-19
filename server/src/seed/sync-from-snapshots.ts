/**
 * Seed script: sync Posps + hierarchy Users from Cognitensor snapshots.
 *
 * Phase A — POSPs
 *   For each row in posps.json:
 *   1. Upsert Posp (code = UserCode, externalId = UserId)
 *   2. Upsert User (email = EmailId, role = POSP, password = UserCode)
 *
 * Phase B — Hierarchy Users
 *   For each unique user in hierarchy.json (deduplicated by UserId):
 *   1. Upsert User (email = usercode@roinet.in, role = DM/ASM/ZH/NH/SUPER_ADMIN)
 *   2. Upsert SalesTeam (employeeCode = UserCode)
 *
 * Run: npx ts-node src/seed/sync-from-snapshots.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import type { ExternalHierarchyUser } from '../common/external-api/external-api.types';
import {
  buildOrgGraph,
  type DistrictGeo,
} from '../common/org-graph/org-graph-builder';
import { persistOrgGraph } from '../common/org-graph/org-graph.repository';
import {
  appRoleFromOrgRole,
  type OrgRole,
} from '../common/external-api/user-type.util';

const prisma = new PrismaClient({ log: ['warn', 'error'] });

const SNAPSHOT_DIR = path.join(__dirname, '../../data/snapshots');

// ── helpers ────────────────────────────────────────────────────────────────

function readSnapshot<T>(filename: string): T[] {
  const raw = fs
    .readFileSync(path.join(SNAPSHOT_DIR, filename), 'utf-8')
    .replace(/^\uFEFF/, ''); // strip BOM if present
  const parsed = JSON.parse(raw) as { Data: T[] };
  return parsed.Data;
}

async function hash(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

function parseDate(raw: string): Date {
  // Format: "25-08-2025 12:04:26"
  const [datePart, timePart] = raw.split(' ');
  const [day, month, year] = datePart.split('-');
  return new Date(`${year}-${month}-${day}T${timePart ?? '00:00:00'}Z`);
}

// ── types ──────────────────────────────────────────────────────────────────

interface PospSnapshotRow {
  UserId: string;
  UserCode: string;
  MobileNo: string;
  EmailId: string;
  districtid: string;
  stateid: string;
  cityid: string;
  HephGcdCode: string;
  CreatedDate: string;
  CreatedBy: string;
}

interface HierarchySnapshotRow {
  DistrictId: string;
  DistrictName: string;
  DistrictManagerId: string;
  DistrictManagerCode: string;
  DistrictManagerName: string;
  R1_UserId: string;
  R1_UserCode: string;
  R1_UserName: string;
  R2_UserId: string;
  R2_UserCode: string;
  R2_UserName: string;
  R3_UserId: string;
  R3_UserCode: string;
  R3_UserName: string;
  R4_UserId: string;
  R4_UserCode: string;
  R4_UserName: string;
  R5_UserId: string;
  R5_UserCode: string;
  R5_UserName: string;
}

interface HierarchyUserFlat {
  userId: string;
  userCode: string;
  userName: string;
  role: string;
  designation: string;
}

// ── Phase A: Seed POSPs ────────────────────────────────────────────────────

async function seedPosps(): Promise<void> {
  const rows = readSnapshot<PospSnapshotRow>('posps.json');
  console.log(`\n📋 Phase A: seeding ${rows.length} POSPs…`);

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const row of rows) {
    const email = row.EmailId?.trim().toLowerCase();
    const code = row.UserCode?.trim();
    if (!email || !code) continue;

    try {
      let joinedDate: Date;
      try {
        joinedDate = row.CreatedDate ? parseDate(row.CreatedDate) : new Date();
      } catch {
        joinedDate = new Date();
      }

      const posp = await prisma.posp.upsert({
        where: { code },
        create: {
          code,
          externalId: row.UserId,
          gcdCode: row.HephGcdCode ?? null,
          name: code,
          mobile: row.MobileNo ?? '',
          email,
          joined: joinedDate,
          active: true,
          districtId: row.districtid || null,
          stateId: row.stateid || null,
          cityId: row.cityid || null,
        },
        update: {
          externalId: row.UserId,
          gcdCode: row.HephGcdCode ?? null,
          mobile: row.MobileNo ?? '',
          email,
          districtId: row.districtid || null,
          stateId: row.stateid || null,
          cityId: row.cityid || null,
        },
      });

      const passwordHash = await hash(code);
      const existing = await prisma.user.findUnique({ where: { email } });

      if (existing) {
        await prisma.user.update({
          where: { email },
          data: {
            passwordHash,
            role: 'POSP',
            status: 'ACTIVE',
            pospId: posp.id,
          },
        });
        updated++;
      } else {
        await prisma.user.create({
          data: {
            email,
            passwordHash,
            role: 'POSP',
            status: 'ACTIVE',
            pospId: posp.id,
          },
        });
        created++;
      }
    } catch (err) {
      errors++;
      if (errors <= 5)
        console.error(`  ✗ POSP ${code}:`, (err as Error).message);
    }
  }

  console.log(`  ✓ created=${created}  updated=${updated}  errors=${errors}`);
}

// ── Phase B: Seed Hierarchy Users ─────────────────────────────────────────

function extractHierarchyUsers(
  rows: ExternalHierarchyUser[],
): HierarchyUserFlat[] {
  const seed = buildOrgGraph(rows);
  return seed.members.map((m) => {
    const orgRole = m.role as OrgRole;
    const appRole = appRoleFromOrgRole(orgRole);
    return {
      userId: m.userId,
      userCode: m.userCode,
      userName: m.userName || m.userCode,
      role: appRole,
      designation: orgRole,
    };
  });
}

async function seedHierarchyUsers(): Promise<void> {
  const rows = readSnapshot<ExternalHierarchyUser>('hierarchy.json');
  const users = extractHierarchyUsers(rows);
  console.log(`\n🏢 Phase B: seeding ${users.length} hierarchy users…`);

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const u of users) {
    const email = `${u.userCode.toLowerCase()}@roinet.in`;
    try {
      const passwordHash = await hash(u.userCode);

      const existing = await prisma.user.findUnique({ where: { email } });
      let userId: string;

      if (existing) {
        await prisma.user.update({
          where: { email },
          data: { passwordHash, role: u.role, status: 'ACTIVE' },
        });
        userId = existing.id;
        updated++;
      } else {
        const newUser = await prisma.user.create({
          data: { email, passwordHash, role: u.role, status: 'ACTIVE' },
        });
        userId = newUser.id;
        created++;
      }

      await prisma.salesTeam.upsert({
        where: { employeeCode: u.userCode },
        create: {
          userId,
          name: u.userName,
          employeeCode: u.userCode,
          designation: u.designation,
          mobile: '',
          email,
          joiningDate: new Date('2020-01-01'),
          status: 'ACTIVE',
        },
        update: {
          userId,
          name: u.userName,
          designation: u.designation,
          email,
          status: 'ACTIVE',
        },
      });
    } catch (err) {
      errors++;
      if (errors <= 5)
        console.error(`  ✗ ${u.userCode} (${u.role}):`, (err as Error).message);
    }
  }

  console.log(`  ✓ created=${created}  updated=${updated}  errors=${errors}`);
}

// ── Phase C: District hierarchy + manager links ────────────────────────────

interface DistrictSnapshotRow {
  StateId: string;
  DistrictId: string;
  DistrictName: string;
  zoneid?: string;
  zonename?: string;
  regionid?: string;
  regionname?: string;
}

async function seedOrgGraph(): Promise<void> {
  const rows = readSnapshot<ExternalHierarchyUser>('hierarchy.json');
  console.log(
    `\n🗺️  Phase C: building org graph from ${rows.length} hierarchy rows…`,
  );

  const geoByDistrict = new Map<string, DistrictGeo>();
  try {
    for (const d of readSnapshot<DistrictSnapshotRow>(
      'districts-sample.json',
    )) {
      geoByDistrict.set(d.DistrictId, {
        stateId: d.StateId ?? null,
        zoneId: d.zoneid ?? null,
        zoneName: d.zonename ?? null,
        regionId: d.regionid ?? null,
        regionName: d.regionname ?? null,
      });
    }
  } catch {
    /* optional */
  }

  const seed = buildOrgGraph(rows, geoByDistrict);
  const counts = await prisma.$transaction((tx) => persistOrgGraph(tx, seed), {
    maxWait: 15_000,
    timeout: 120_000,
  });
  console.log(
    `  ✓ members=${counts.members} edges=${counts.edges} closures=${counts.closures} districtChains=${counts.districtChains}`,
  );

  // Wire SalesTeam.managerId from the district chain (child → parent) — kept
  // only for the internal CRM tree view; it no longer drives data scoping.
  const childToParent = new Map<string, string>();
  for (const e of rows) {
    const chain = [
      e.DistrictManagerCode,
      e.R1_UserCode,
      e.R2_UserCode,
      e.R3_UserCode,
      e.R4_UserCode,
    ].filter((c): c is string => !!c);
    for (let i = 0; i < chain.length - 1; i++) {
      if (!childToParent.has(chain[i]))
        childToParent.set(chain[i], chain[i + 1]);
    }
  }
  const team = await prisma.salesTeam.findMany({
    select: { id: true, employeeCode: true },
  });
  const codeToId = new Map(team.map((t) => [t.employeeCode, t.id]));
  let linked = 0;
  for (const [childCode, parentCode] of childToParent.entries()) {
    const childId = codeToId.get(childCode);
    const parentId = codeToId.get(parentCode);
    if (childId && parentId && childId !== parentId) {
      await prisma.salesTeam.update({
        where: { id: childId },
        data: { managerId: parentId },
      });
      linked++;
    }
  }
  console.log(`  ✓ manager links=${linked}`);
}

// ── main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('🚀 sync-from-snapshots — start');
  await seedPosps();
  await seedHierarchyUsers();
  await seedOrgGraph();
  console.log('\n✅ Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
