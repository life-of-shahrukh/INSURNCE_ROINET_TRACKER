import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { SALES_TEAM_DEFS } from './seed-generators';

const prisma = new PrismaClient();

/** Preferred demo POSP code when an unlinked synced POSP exists. */
const DEMO_POSP_CODE = 'CSP023057';

const hash = (pwd: string) => bcrypt.hash(pwd, 10);

async function seedUsers(): Promise<
  Array<{ id: string; email: string; role: string }>
> {
  console.log('\n[1/2] Users…');

  const defs = [
    {
      email: 'superadmin@roinet.com',
      password: 'Admin@1234',
      role: 'SUPER_ADMIN',
      label: 'Super Admin',
    },
    {
      email: 'national@roinet.com',
      password: 'National@123',
      role: 'NATIONAL_HEAD',
      label: 'National Head',
    },
    {
      email: 'zonal@roinet.com',
      password: 'Zonal@1234',
      role: 'ZH',
      label: 'Zonal Head',
    },
    {
      email: 'regional@roinet.com',
      password: 'Regional@123',
      role: 'RH',
      label: 'Regional Head',
    },
    {
      email: 'asm@roinet.com',
      password: 'Asm@12345',
      role: 'ASM',
      label: 'Area Sales Manager',
    },
    {
      email: 'dm@roinet.com',
      password: 'Dm@123456',
      role: 'DM',
      label: 'District Manager',
    },
    {
      email: 'posp@roinet.com',
      password: 'Posp@1234',
      role: 'POSP',
      label: 'POSP Agent',
    },
  ];

  const results: Array<{ id: string; email: string; role: string }> = [];

  for (const u of defs) {
    const created = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        passwordHash: await hash(u.password),
        role: u.role,
        status: 'ACTIVE',
      },
      create: {
        email: u.email,
        passwordHash: await hash(u.password),
        role: u.role,
        status: 'ACTIVE',
      },
      select: { id: true, email: true, role: true },
    });
    console.log(`  ✓  ${u.label.padEnd(20)} ${u.email}`);
    results.push(created);
  }

  return results;
}

async function linkDemoPospUser(
  users: Array<{ id: string; email: string; role: string }>,
): Promise<void> {
  const pospUser = users.find((u) => u.email === 'posp@roinet.com');
  if (!pospUser) return;

  const linkedPospIds = new Set(
    (
      await prisma.user.findMany({
        where: { pospId: { not: null }, id: { not: pospUser.id } },
        select: { pospId: true },
      })
    )
      .map((u) => u.pospId)
      .filter((id): id is string => !!id),
  );

  const candidates = await prisma.posp.findMany({
    where: { externalId: { not: null }, districtId: { not: null }, active: true },
    select: { id: true, name: true, code: true },
    orderBy: { code: 'asc' },
  });

  const preferred = candidates.find((p) => p.code === DEMO_POSP_CODE);
  const syncedPosp =
    preferred && !linkedPospIds.has(preferred.id)
      ? preferred
      : candidates.find((p) => !linkedPospIds.has(p.id));

  if (!syncedPosp) {
    console.log(
      '  ⚠  All synced POSPs are already linked — use a real POSP login',
    );
    console.log('     e.g. shivraj.wanole@roinet.in / CSP023057');
    return;
  }

  await prisma.user.update({
    where: { id: pospUser.id },
    data: { pospId: syncedPosp.id },
  });
  console.log(
    `  ✓  posp@roinet.com linked to ${syncedPosp.code} (${syncedPosp.name})`,
  );
}

async function seedSalesTeam(
  users: Array<{ id: string; email: string; role: string }>,
): Promise<void> {
  console.log('\n[2/2] Sales Team…');

  const byEmail = new Map(users.map((u) => [u.email, u.id]));

  let managerId: string | null = null;
  for (const def of SALES_TEAM_DEFS) {
    const userId = byEmail.get(def.email);
    if (!userId) continue;

    const existing = await prisma.salesTeam.findUnique({ where: { userId } });
    if (existing) {
      await prisma.salesTeam.update({
        where: { id: existing.id },
        data: { managerId, designation: def.designation },
      });
      console.log(`  updated  ${def.name} (managerId chain repaired)`);
      managerId = existing.id;
      continue;
    }

    const member: { id: string } = await prisma.salesTeam.create({
      data: {
        userId,
        name: def.name,
        employeeCode: def.employeeCode,
        designation: def.designation,
        territory: def.territory,
        mobile: def.mobile,
        email: def.email,
        joiningDate: new Date('2022-01-15'),
        status: 'ACTIVE',
        managerId,
        zoneName: def.territory,
      },
      select: { id: true },
    });
    console.log(`  created  ${def.name} (${def.employeeCode})`);
    managerId = member.id;
  }
}

async function main(): Promise<void> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' Roinet CRM — Demo accounts seed');
  console.log(' (CRM data: npm run seed:crm after seed:all)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const users = await seedUsers();
  await linkDemoPospUser(users);
  await seedSalesTeam(users);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' Seed complete. Login credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Super Admin    superadmin@roinet.com  / Admin@1234');
  console.log('  National Head  national@roinet.com    / National@123');
  console.log('  Zonal Head     zonal@roinet.com       / Zonal@1234');
  console.log('  Regional Head  regional@roinet.com    / Regional@123');
  console.log('  ASM            asm@roinet.com         / Asm@12345');
  console.log('  DM             dm@roinet.com          / Dm@123456');
  console.log('  POSP (demo)      posp@roinet.com        / Posp@1234');
  console.log('  POSP (real)      shivraj.wanole@roinet.in / CSP023057');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('\n[SEED ERROR]', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
