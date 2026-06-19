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
  /** Full name — added to API response */
  username?: string;
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
  usertype: string;
  R1_UserId: string;
  R1_UserCode: string;
  R1_UserName: string;
  R1_usertype: string;
  R2_UserId: string;
  R2_UserCode: string;
  R2_UserName: string;
  R2_usertype: string;
  R3_UserId: string;
  R3_UserCode: string;
  R3_UserName: string;
  R3_usertype: string;
  R4_UserId: string;
  R4_UserCode: string;
  R4_UserName: string;
  R4_usertype: string;
  R5_UserId: string;
  R5_UserCode: string;
  R5_UserName: string;
  R5_usertype: string;
  R6_UserId: string;
  R6_UserCode: string;
  R6_UserName: string;
  R6_usertype: string;
  R7_UserId: string;
  R7_UserCode: string;
  R7_UserName: string;
  R7_usertype: string;
  [key: string]: string;
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
          name: row.username?.trim() || code,
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
          name: row.username?.trim() || code,
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

/**
 * Maps a Cognitensor usertype string to our internal Role string.
 * Returns null for types we don't handle (ADMIN=0, CMF=1, CSF=2).
 */
function usertypeToRole(ut: string): string | null {
  switch (ut) {
    case '3':  return 'POSP';
    case '4':  return 'ASM';
    case '11': return 'ASM';   // ASSISTASM → same role
    case '6':  return 'RH';
    case '10': return 'ZH';
    case '12': return 'DM';    // CH = Cluster Head
    case '14': return 'NATIONAL_HEAD'; // SZH
    default:   return null;
  }
}

function usertypeToDesignation(ut: string): string | null {
  switch (ut) {
    case '3':  return 'POSP';
    case '4':  return 'ASM';
    case '11': return 'ASSISTASM';
    case '6':  return 'RH';
    case '10': return 'ZH';
    case '12': return 'DM';
    case '14': return 'NATIONAL_HEAD';
    default:   return null;
  }
}

function extractHierarchyUsers(
  rows: HierarchySnapshotRow[],
): HierarchyUserFlat[] {
  const seen = new Map<string, HierarchyUserFlat>();

  for (const row of rows) {
    // Build all persons from this row using usertype — NOT positional assumption
    const persons: Array<{ userId: string; code: string; name: string; ut: string }> = [
      { userId: row.DistrictManagerId, code: row.DistrictManagerCode, name: row.DistrictManagerName, ut: row.usertype },
    ];
    for (let i = 1; i <= 7; i++) {
      const r = row as Record<string, string>;
      persons.push({
        userId: r[`R${i}_UserId`] ?? '',
        code:   r[`R${i}_UserCode`] ?? '',
        name:   r[`R${i}_UserName`] ?? '',
        ut:     r[`R${i}_usertype`] ?? '',
      });
    }

    for (const p of persons) {
      if (!p.userId || !p.code || !p.ut) continue;
      const role = usertypeToRole(p.ut);
      const designation = usertypeToDesignation(p.ut);
      if (!role || !designation) continue; // skip ADMIN (0) and unhandled types
      if (!seen.has(p.userId)) {
        seen.set(p.userId, {
          userId: p.userId,
          userCode: p.code,
          userName: p.name || p.code,
          role,
          designation,
        });
      }
    }
  }

  return Array.from(seen.values());
}

async function seedHierarchyUsers(): Promise<void> {
  const rows = readSnapshot<HierarchySnapshotRow>('hierarchy.json');
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
}

/**
 * Extracts the person at a given usertype from a hierarchy row by scanning
 * all R-positions. The Cognitensor API does NOT guarantee fixed positions —
 * R1 is NOT always ASM, R2 is NOT always RH. We must match by usertype.
 *
 * Usertype mapping:
 *   12 (CH)     → dmCode
 *   4  (ASM)    → asmCode
 *   11 (ASSIST) → asmCode (same column)
 *   6  (RH)     → rhCode
 *   10 (ZH)     → zhCode
 *   14 (SZH)    → nhCode
 */
function extractByUsertype(
  row: HierarchySnapshotRow,
  targetUsertype: string,
): { id: string | null; code: string | null; name: string | null } {
  // Check DM level first
  if (row.usertype === targetUsertype) {
    return {
      id: row.DistrictManagerId || null,
      code: row.DistrictManagerCode || null,
      name: row.DistrictManagerName || null,
    };
  }
  // Scan R1–R7
  for (let i = 1; i <= 7; i++) {
    const ut = (row as Record<string, string>)[`R${i}_usertype`];
    if (ut === targetUsertype) {
      return {
        id: (row as Record<string, string>)[`R${i}_UserId`] || null,
        code: (row as Record<string, string>)[`R${i}_UserCode`] || null,
        name: (row as Record<string, string>)[`R${i}_UserName`] || null,
      };
    }
  }
  return { id: null, code: null, name: null };
}

async function seedDistrictHierarchy(): Promise<void> {
  const rows = readSnapshot<HierarchySnapshotRow>('hierarchy.json');
  console.log(`\n🗺️  Phase C: seeding ${rows.length} district hierarchy rows…`);

  const stateByDistrict = new Map<string, string>();
  try {
    for (const d of readSnapshot<DistrictSnapshotRow>('districts.json')) {
      stateByDistrict.set(d.DistrictId, d.StateId);
    }
  } catch {
    // fall back to districts-sample.json
    try {
      for (const d of readSnapshot<DistrictSnapshotRow>('districts-sample.json')) {
        stateByDistrict.set(d.DistrictId, d.StateId);
      }
    } catch { /* optional */ }
  }

  let count = 0;
  for (const e of rows) {
    if (!e.DistrictId) continue;

    // Map each person by their usertype, not their positional R-number.
    // CH (12) or ASM (4/11) at DM level, RH (6), ZH (10), SZH (14) → nhCode.
    const dm   = extractByUsertype(e, '12');
    const asmA = extractByUsertype(e, '4');
    const asmB = extractByUsertype(e, '11'); // ASSISTASM — same column as ASM
    const asm  = asmA.code ? asmA : asmB;
    const rh   = extractByUsertype(e, '6');
    const zh   = extractByUsertype(e, '10');
    const szh  = extractByUsertype(e, '14'); // SZH → nhCode

    const payload = {
      districtName: e.DistrictName || null,
      stateId: stateByDistrict.get(e.DistrictId) ?? null,
      dmId:   dm.id,
      dmCode: dm.code,
      dmName: dm.name,
      asmId:   asm.id,
      asmCode: asm.code,
      asmName: asm.name,
      rhId:   rh.id,
      rhCode: rh.code,
      rhName: rh.name,
      zhId:   zh.id,
      zhCode: zh.code,
      zhName: zh.name,
      nhId:   szh.id,
      nhCode: szh.code,
      nhName: szh.name,
    };
    await prisma.districtHierarchy.upsert({
      where: { districtId: e.DistrictId },
      create: { districtId: e.DistrictId, ...payload },
      update: payload,
    });
    count++;
  }
  console.log(`  ✓ upserted=${count}`);

  // Wire SalesTeam.managerId using the full R1–R7 chain (ordered by position).
  const childToParent = new Map<string, string>();
  for (const e of rows) {
    // Build ordered chain: DM → R1 → R2 → ... → R7 (filter empties)
    const chain = [
      e.DistrictManagerCode,
      ...[1,2,3,4,5,6,7].map((i) => (e as Record<string,string>)[`R${i}_UserCode`]),
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
  await seedDistrictHierarchy();
  console.log('\n✅ Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
