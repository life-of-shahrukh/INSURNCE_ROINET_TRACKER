import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  buildCustomerSeed,
  buildDealSeed,
  buildLeadSeed,
  buildPospSeed,
  SALES_TEAM_DEFS,
  SEED_TARGETS,
} from './seed-generators';

const prisma = new PrismaClient();

const hash = (pwd: string) => bcrypt.hash(pwd, 10);

async function seedUsers() {
  console.log('\n[1/6] Users…');

  const defs = [
    { email: 'superadmin@roinet.com', password: 'Admin@1234',    role: 'SUPER_ADMIN',   label: 'Super Admin' },
    { email: 'national@roinet.com',   password: 'National@123',  role: 'NATIONAL_HEAD', label: 'National Head' },
    { email: 'zonal@roinet.com',      password: 'Zonal@1234',    role: 'ZH',            label: 'Zonal Head' },
    { email: 'regional@roinet.com',   password: 'Regional@123',  role: 'RH',            label: 'Regional Head' },
    { email: 'asm@roinet.com',        password: 'Asm@12345',     role: 'ASM',           label: 'Area Sales Manager' },
    { email: 'dm@roinet.com',         password: 'Dm@123456',     role: 'DM',            label: 'District Manager' },
    { email: 'posp@roinet.com',       password: 'Posp@1234',     role: 'POSP',          label: 'POSP Agent' },
  ];

  const results: Array<{ id: string; email: string; role: string }> = [];

  for (const u of defs) {
    const created = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        passwordHash: await hash(u.password),
        role:         u.role,
        status:       'ACTIVE',
      },
      create: {
        email:        u.email,
        passwordHash: await hash(u.password),
        role:         u.role,
        status:       'ACTIVE',
      },
      select: { id: true, email: true, role: true },
    });
    console.log(`  ✓  ${u.label.padEnd(20)} ${u.email}`);
    results.push(created);
  }

  return results;
}

async function seedSalesTeam(users: Array<{ id: string; email: string; role: string }>) {
  console.log('\n[2/6] Sales Team…');

  const byEmail = new Map(users.map((u) => [u.email, u.id]));
  const created: Array<{ id: string; name: string }> = [];

  let managerId: string | null = null;
  for (const def of SALES_TEAM_DEFS) {
    const userId = byEmail.get(def.email);
    if (!userId) continue;

    const existing = await prisma.salesTeam.findUnique({ where: { userId } });
    if (existing) {
      console.log(`  exists   ${def.name} (${def.employeeCode})`);
      created.push({ id: existing.id, name: existing.name });
      managerId = existing.id;
      continue;
    }

    const member: { id: string; name: string } = await prisma.salesTeam.create({
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
      select: { id: true, name: true },
    });
    console.log(`  created  ${def.name} (${def.employeeCode})`);
    created.push(member);
    managerId = member.id;
  }

  return created;
}

async function seedCustomers() {
  console.log('\n[3/6] Customers…');

  try {
    await prisma.customer.count();
  } catch {
    console.log('  ⚠  Customer table not found — skipping');
    return [];
  }

  const existing = await prisma.customer.findMany({
    select: { id: true, name: true, mobile: true },
    orderBy: { createdAt: 'asc' },
  });

  const customers = [...existing.map((c) => ({ id: c.id, name: c.name }))];
  const existingMobiles = new Set(existing.map((c) => c.mobile));

  if (customers.length >= SEED_TARGETS.customers) {
    console.log(`  ok       ${customers.length} customers (target ${SEED_TARGETS.customers})`);
    return customers;
  }

  for (let i = 0; i < SEED_TARGETS.customers; i++) {
    const data = buildCustomerSeed(i);
    if (existingMobiles.has(data.mobile)) continue;

    const created = await prisma.customer.create({
      data,
      select: { id: true, name: true },
    });
    existingMobiles.add(data.mobile);
    customers.push(created);
  }

  console.log(`  total    ${customers.length} customers`);
  return customers;
}

async function seedPosp(users: Array<{ id: string; email: string; role: string }>) {
  console.log('\n[4/6] POSP Roster…');

  const pospUser = users.find((u) => u.role === 'POSP');
  const posps: Array<{ id: string; name: string }> = [];

  const existing = await prisma.posp.findMany({
    select: { id: true, name: true, code: true },
    orderBy: { code: 'asc' },
  });
  for (const p of existing) {
    posps.push({ id: p.id, name: p.name });
  }

  const existingCodes = new Set(existing.map((p) => p.code));

  for (let i = 0; i < SEED_TARGETS.posp; i++) {
    const data = buildPospSeed(i);
    if (existingCodes.has(data.code)) continue;

    const created = await prisma.posp.create({
      data,
      select: { id: true, name: true },
    });
    existingCodes.add(data.code);
    posps.push(created);
    console.log(`  created  ${created.name} (${data.code})`);
  }

  if (posps.length > existing.length) {
    console.log(`  total    ${posps.length} POSPs`);
  } else {
    console.log(`  ok       ${posps.length} POSPs (target ${SEED_TARGETS.posp})`);
  }

  if (pospUser && posps[0]) {
    const user = await prisma.user.findUnique({ where: { id: pospUser.id } });
    if (user && !user.pospId) {
      await prisma.user.update({ where: { id: pospUser.id }, data: { pospId: posps[0].id } });
      console.log(`  linked   posp@roinet.com → ${posps[0].name}`);
    }
  }

  return posps;
}

async function seedDeals(
  posps: Array<{ id: string; name: string }>,
  customers: Array<{ id: string; name: string }>,
) {
  console.log('\n[5/6] Deals…');

  if (posps.length === 0) {
    console.log('  ⚠  No POSPs — skipping deals');
    return;
  }

  const existingCount = await prisma.deal.count();
  if (existingCount >= SEED_TARGETS.deals) {
    console.log(`  ok       ${existingCount} deals (target ${SEED_TARGETS.deals})`);
    return;
  }

  const toCreate = SEED_TARGETS.deals - existingCount;
  const deals = Array.from({ length: toCreate }, (_, offset) => {
    const index = existingCount + offset;
    const posp = posps[index % posps.length];
    const customerName = customers[index % customers.length]?.name ?? personNameFallback(index);
    return buildDealSeed(index, posp.id, customerName);
  });

  await prisma.deal.createMany({ data: deals });
  console.log(`  added    ${deals.length} deals (total ${existingCount + deals.length})`);
}

async function seedLeads(
  customers: Array<{ id: string; name: string }>,
  salesTeam: Array<{ id: string; name: string }>,
) {
  console.log('\n[6/6] Leads…');

  if (customers.length === 0) {
    console.log('  ⚠  No customers — skipping leads');
    return;
  }

  const existingCount = await prisma.lead.count();
  if (existingCount >= SEED_TARGETS.leads) {
    console.log(`  ok       ${existingCount} leads (target ${SEED_TARGETS.leads})`);
    return;
  }

  const toCreate = SEED_TARGETS.leads - existingCount;
  for (let offset = 0; offset < toCreate; offset++) {
    const index = existingCount + offset;
    const customer = customers[index % customers.length];
    const assignee = salesTeam.length > 0 ? salesTeam[index % salesTeam.length] : null;
    await prisma.lead.create({
      data: buildLeadSeed(index, customer.id, assignee?.id ?? null),
    });
  }

  console.log(`  added    ${toCreate} leads (total ${existingCount + toCreate})`);
}

function personNameFallback(index: number): string {
  return buildCustomerSeed(index).name;
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' Roinet CRM — Database Seed');
  console.log(` Targets: ${SEED_TARGETS.customers} customers, ${SEED_TARGETS.posp} POSPs,`);
  console.log(`          ${SEED_TARGETS.deals} deals, ${SEED_TARGETS.leads} leads`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const users = await seedUsers();
  const salesTeam = await seedSalesTeam(users);
  const customers = await seedCustomers();
  const posps = await seedPosp(users);
  await seedDeals(posps, customers);
  await seedLeads(customers, salesTeam);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' Seed complete. Login credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Super Admin    superadmin@roinet.com  / Admin@1234');
  console.log('  National Head  national@roinet.com    / National@123');
  console.log('  Zonal Head     zonal@roinet.com       / Zonal@1234');
  console.log('  Regional Head  regional@roinet.com    / Regional@123');
  console.log('  ASM            asm@roinet.com         / Asm@12345');
  console.log('  DM             dm@roinet.com          / Dm@123456');
  console.log('  POSP           posp@roinet.com        / Posp@1234');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => { console.error('\n[SEED ERROR]', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
