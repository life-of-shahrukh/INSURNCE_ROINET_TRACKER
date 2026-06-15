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

async function seedSalesTeam(
  users: Array<{ id: string; email: string; role: string }>,
) {
  console.log('\n[2/6] Sales Team…');

  const byEmail = new Map(users.map((u) => [u.email, u.id]));
  const created: Array<{ id: string; name: string }> = [];

  let managerId: string | null = null;
  for (const def of SALES_TEAM_DEFS) {
    const userId = byEmail.get(def.email);
    if (!userId) continue;

    const existing = await prisma.salesTeam.findUnique({ where: { userId } });
    if (existing) {
      // Always update managerId so the hierarchy chain is correct even if
      // this record was created by an earlier seed run without the chain.
      await prisma.salesTeam.update({
        where: { id: existing.id },
        data: { managerId, designation: def.designation },
      });
      console.log(`  updated  ${def.name} (managerId chain repaired)`);
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
    console.log(
      `  ok       ${customers.length} customers (target ${SEED_TARGETS.customers})`,
    );
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

async function seedPosp(
  users: Array<{ id: string; email: string; role: string }>,
) {
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
    console.log(
      `  ok       ${posps.length} POSPs (target ${SEED_TARGETS.posp})`,
    );
  }

  if (pospUser && posps[0]) {
    const user = await prisma.user.findUnique({ where: { id: pospUser.id } });
    // Only link if: user has no pospId AND the target POSP has no existing user
    if (user && !user.pospId) {
      const pospAlreadyOwned = await prisma.user.findFirst({
        where: { pospId: posps[0].id },
      });
      if (!pospAlreadyOwned) {
        await prisma.user.update({
          where: { id: pospUser.id },
          data: { pospId: posps[0].id },
        });
        console.log(`  linked   posp@roinet.com → ${posps[0].name}`);
      } else {
        console.log(`  skip     posps[0] already owned by another user`);
      }
    }
  }

  // POSP ownership is explicit via asmId → the directly-managing SalesTeam
  // member. Base POSPs are all owned by the base DM (the leaf manager) so the
  // ASM → DM → POSP cascade resolves cleanly with no collisions.
  const baseDm = await prisma.salesTeam.findFirst({
    where: { designation: 'DM' },
    select: { id: true, zoneId: true, regionId: true, areaId: true },
  });

  if (baseDm) {
    const allPospIds = posps.map((p) => p.id);
    await prisma.posp.updateMany({
      where: { id: { in: allPospIds } },
      data: {
        asmId: baseDm.id,
        zoneId: baseDm.zoneId,
        regionId: baseDm.regionId,
        areaId: baseDm.areaId,
      },
    });
    console.log(
      `  linked   ${allPospIds.length} POSPs → base DM (asmId ownership + geo)`,
    );
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
    console.log(
      `  ok       ${existingCount} deals (target ${SEED_TARGETS.deals})`,
    );
    return;
  }

  const toCreate = SEED_TARGETS.deals - existingCount;
  const deals = Array.from({ length: toCreate }, (_, offset) => {
    const index = existingCount + offset;
    const posp = posps[index % posps.length];
    const customerName =
      customers[index % customers.length]?.name ?? personNameFallback(index);
    return buildDealSeed(index, posp.id, customerName);
  });

  await prisma.deal.createMany({ data: deals });
  console.log(
    `  added    ${deals.length} deals (total ${existingCount + deals.length})`,
  );
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
    console.log(
      `  ok       ${existingCount} leads (target ${SEED_TARGETS.leads})`,
    );
    return;
  }

  const toCreate = SEED_TARGETS.leads - existingCount;
  for (let offset = 0; offset < toCreate; offset++) {
    const index = existingCount + offset;
    const customer = customers[index % customers.length];
    const assignee =
      salesTeam.length > 0 ? salesTeam[index % salesTeam.length] : null;
    await prisma.lead.create({
      data: buildLeadSeed(index, customer.id, assignee?.id ?? null),
    });
  }

  console.log(
    `  added    ${toCreate} leads (total ${existingCount + toCreate})`,
  );
}

function personNameFallback(index: number): string {
  return buildCustomerSeed(index).name;
}

/**
 * One-time backfill: for every existing Deal whose geo fields are null but
 * has a pospId, resolve geo via the POSP → ASM → DM chain and update the deal.
 * Also fixes Deals created by managers (no pospId) by looking up the POSP user's SalesTeam.
 */
async function backfillDealGeo() {
  console.log('\n[7/7] Backfill deal geo…');

  // Deals with a POSP assigned but no geo
  const dealsNeedingGeo = await prisma.deal.findMany({
    where: { zoneId: null },
    select: { id: true, pospId: true },
  });

  if (dealsNeedingGeo.length === 0) {
    console.log('  ok       all deals already have geo');
    return;
  }

  // Fetch all POSPs at once to avoid N+1
  const pospIds = [
    ...new Set(
      dealsNeedingGeo.map((d) => d.pospId).filter(Boolean) as string[],
    ),
  ];
  const posps = await prisma.posp.findMany({
    where: { id: { in: pospIds } },
    select: {
      id: true,
      zoneId: true,
      regionId: true,
      areaId: true,
      districtId: true,
      asmId: true,
    },
  });
  const pospMap = new Map(posps.map((p) => [p.id, p]));

  // Fetch ASM geo for all linked ASMs
  const asmIds = [
    ...new Set(posps.map((p) => p.asmId).filter(Boolean) as string[]),
  ];
  const asms = await prisma.salesTeam.findMany({
    where: { id: { in: asmIds } },
    select: { id: true, zoneId: true, regionId: true, areaId: true },
  });
  const asmMap = new Map(asms.map((a) => [a.id, a]));

  let updated = 0;
  for (const deal of dealsNeedingGeo) {
    let zoneId: string | null = null;
    let regionId: string | null = null;
    let areaId: string | null = null;
    let districtId: string | null = null;

    if (deal.pospId) {
      const posp = pospMap.get(deal.pospId);
      if (posp) {
        // Tier 1: POSP has its own geo
        if (posp.zoneId || posp.regionId || posp.areaId) {
          zoneId = posp.zoneId;
          regionId = posp.regionId;
          areaId = posp.areaId;
          districtId = posp.districtId;
        } else if (posp.asmId) {
          // Tier 2: propagate from ASM
          const asm = asmMap.get(posp.asmId);
          if (asm) {
            zoneId = asm.zoneId;
            regionId = asm.regionId;
            areaId = asm.areaId;
          }
        }
      }
    }

    if (zoneId || regionId || areaId) {
      await prisma.deal.update({
        where: { id: deal.id },
        data: { zoneId, regionId, areaId, districtId },
      });
      updated++;
    }
  }

  console.log(
    `  updated  ${updated} / ${dealsNeedingGeo.length} deals with geo`,
  );
}

// ── Expanded hierarchy tree definition ──────────────────────────────────────
//
// Each ZH has 2 RHs → each RH has 2 ASMs → each ASM has 2 DMs → 5 POSPs/DM.
// This gives testers 3 ZHs, 6 RHs, 12 ASMs, 24 DMs, 120 expanded POSPs.
//
interface HierarchyNodeDef {
  email: string;
  name: string;
  designation: 'ZH' | 'RH' | 'ASM' | 'DM';
  employeeCode: string;
  territory: string;
  mobile: string;
  zoneId: string;
  regionId?: string;
  areaId?: string;
  children: HierarchyNodeDef[];
}

const EXPANDED_HIERARCHY: HierarchyNodeDef[] = [
  // ZH-2: South Zone
  {
    email: 'zh-south@seed.roinet.com',
    name: 'Zonal Head South',
    designation: 'ZH',
    employeeCode: 'EMP-Z002',
    territory: 'South Zone',
    mobile: '9100000012',
    zoneId: 'zone-south',
    children: [
      {
        email: 'rh-ap@seed.roinet.com',
        name: 'Regional Head AP',
        designation: 'RH',
        employeeCode: 'EMP-R011',
        territory: 'Andhra Pradesh',
        mobile: '9100000021',
        zoneId: 'zone-south',
        regionId: 'region-ap',
        children: [
          {
            email: 'asm-hyd@seed.roinet.com',
            name: 'ASM Hyderabad',
            designation: 'ASM',
            employeeCode: 'EMP-A021',
            territory: 'Hyderabad',
            mobile: '9100000031',
            zoneId: 'zone-south',
            regionId: 'region-ap',
            areaId: 'area-hyd',
            children: [
              {
                email: 'dm-hyd-c@seed.roinet.com',
                name: 'DM Hyderabad Central',
                designation: 'DM',
                employeeCode: 'EMP-D031',
                territory: 'Hyd Central',
                mobile: '9100000041',
                zoneId: 'zone-south',
                regionId: 'region-ap',
                areaId: 'area-hyd-c',
                children: [],
              },
              {
                email: 'dm-hyd-w@seed.roinet.com',
                name: 'DM Hyderabad West',
                designation: 'DM',
                employeeCode: 'EMP-D032',
                territory: 'Hyd West',
                mobile: '9100000042',
                zoneId: 'zone-south',
                regionId: 'region-ap',
                areaId: 'area-hyd-w',
                children: [],
              },
            ],
          },
          {
            email: 'asm-viz@seed.roinet.com',
            name: 'ASM Vizag',
            designation: 'ASM',
            employeeCode: 'EMP-A022',
            territory: 'Vizag',
            mobile: '9100000032',
            zoneId: 'zone-south',
            regionId: 'region-ap',
            areaId: 'area-viz',
            children: [
              {
                email: 'dm-viz-n@seed.roinet.com',
                name: 'DM Vizag North',
                designation: 'DM',
                employeeCode: 'EMP-D033',
                territory: 'Vizag North',
                mobile: '9100000043',
                zoneId: 'zone-south',
                regionId: 'region-ap',
                areaId: 'area-viz-n',
                children: [],
              },
              {
                email: 'dm-viz-s@seed.roinet.com',
                name: 'DM Vizag South',
                designation: 'DM',
                employeeCode: 'EMP-D034',
                territory: 'Vizag South',
                mobile: '9100000044',
                zoneId: 'zone-south',
                regionId: 'region-ap',
                areaId: 'area-viz-s',
                children: [],
              },
            ],
          },
        ],
      },
      {
        email: 'rh-kn@seed.roinet.com',
        name: 'Regional Head Karnataka',
        designation: 'RH',
        employeeCode: 'EMP-R012',
        territory: 'Karnataka',
        mobile: '9100000022',
        zoneId: 'zone-south',
        regionId: 'region-kn',
        children: [
          {
            email: 'asm-blr@seed.roinet.com',
            name: 'ASM Bengaluru',
            designation: 'ASM',
            employeeCode: 'EMP-A023',
            territory: 'Bengaluru',
            mobile: '9100000033',
            zoneId: 'zone-south',
            regionId: 'region-kn',
            areaId: 'area-blr',
            children: [
              {
                email: 'dm-blr-n@seed.roinet.com',
                name: 'DM Bengaluru North',
                designation: 'DM',
                employeeCode: 'EMP-D035',
                territory: 'Blr North',
                mobile: '9100000045',
                zoneId: 'zone-south',
                regionId: 'region-kn',
                areaId: 'area-blr-n',
                children: [],
              },
              {
                email: 'dm-blr-s@seed.roinet.com',
                name: 'DM Bengaluru South',
                designation: 'DM',
                employeeCode: 'EMP-D036',
                territory: 'Blr South',
                mobile: '9100000046',
                zoneId: 'zone-south',
                regionId: 'region-kn',
                areaId: 'area-blr-s',
                children: [],
              },
            ],
          },
          {
            email: 'asm-mys@seed.roinet.com',
            name: 'ASM Mysuru',
            designation: 'ASM',
            employeeCode: 'EMP-A024',
            territory: 'Mysuru',
            mobile: '9100000034',
            zoneId: 'zone-south',
            regionId: 'region-kn',
            areaId: 'area-mys',
            children: [
              {
                email: 'dm-mys-c@seed.roinet.com',
                name: 'DM Mysuru Central',
                designation: 'DM',
                employeeCode: 'EMP-D037',
                territory: 'Mys Central',
                mobile: '9100000047',
                zoneId: 'zone-south',
                regionId: 'region-kn',
                areaId: 'area-mys-c',
                children: [],
              },
              {
                email: 'dm-mys-r@seed.roinet.com',
                name: 'DM Mysuru Rural',
                designation: 'DM',
                employeeCode: 'EMP-D038',
                territory: 'Mys Rural',
                mobile: '9100000048',
                zoneId: 'zone-south',
                regionId: 'region-kn',
                areaId: 'area-mys-r',
                children: [],
              },
            ],
          },
        ],
      },
    ],
  },
  // ZH-3: North Zone
  {
    email: 'zh-north@seed.roinet.com',
    name: 'Zonal Head North',
    designation: 'ZH',
    employeeCode: 'EMP-Z003',
    territory: 'North Zone',
    mobile: '9100000013',
    zoneId: 'zone-north',
    children: [
      {
        email: 'rh-dl@seed.roinet.com',
        name: 'Regional Head Delhi',
        designation: 'RH',
        employeeCode: 'EMP-R013',
        territory: 'Delhi NCR',
        mobile: '9100000023',
        zoneId: 'zone-north',
        regionId: 'region-dl',
        children: [
          {
            email: 'asm-ndl@seed.roinet.com',
            name: 'ASM New Delhi',
            designation: 'ASM',
            employeeCode: 'EMP-A031',
            territory: 'New Delhi',
            mobile: '9100000035',
            zoneId: 'zone-north',
            regionId: 'region-dl',
            areaId: 'area-ndl',
            children: [
              {
                email: 'dm-ndl-c@seed.roinet.com',
                name: 'DM New Delhi Central',
                designation: 'DM',
                employeeCode: 'EMP-D041',
                territory: 'NDL Central',
                mobile: '9100000051',
                zoneId: 'zone-north',
                regionId: 'region-dl',
                areaId: 'area-ndl-c',
                children: [],
              },
              {
                email: 'dm-ndl-w@seed.roinet.com',
                name: 'DM New Delhi West',
                designation: 'DM',
                employeeCode: 'EMP-D042',
                territory: 'NDL West',
                mobile: '9100000052',
                zoneId: 'zone-north',
                regionId: 'region-dl',
                areaId: 'area-ndl-w',
                children: [],
              },
            ],
          },
          {
            email: 'asm-gdg@seed.roinet.com',
            name: 'ASM Gurugram',
            designation: 'ASM',
            employeeCode: 'EMP-A032',
            territory: 'Gurugram',
            mobile: '9100000036',
            zoneId: 'zone-north',
            regionId: 'region-dl',
            areaId: 'area-gdg',
            children: [
              {
                email: 'dm-gdg-1@seed.roinet.com',
                name: 'DM Gurugram Sector 1',
                designation: 'DM',
                employeeCode: 'EMP-D043',
                territory: 'GDG Sec-1',
                mobile: '9100000053',
                zoneId: 'zone-north',
                regionId: 'region-dl',
                areaId: 'area-gdg-1',
                children: [],
              },
              {
                email: 'dm-gdg-2@seed.roinet.com',
                name: 'DM Gurugram Sector 2',
                designation: 'DM',
                employeeCode: 'EMP-D044',
                territory: 'GDG Sec-2',
                mobile: '9100000054',
                zoneId: 'zone-north',
                regionId: 'region-dl',
                areaId: 'area-gdg-2',
                children: [],
              },
            ],
          },
        ],
      },
      {
        email: 'rh-up@seed.roinet.com',
        name: 'Regional Head UP',
        designation: 'RH',
        employeeCode: 'EMP-R014',
        territory: 'Uttar Pradesh',
        mobile: '9100000024',
        zoneId: 'zone-north',
        regionId: 'region-up',
        children: [
          {
            email: 'asm-lko@seed.roinet.com',
            name: 'ASM Lucknow',
            designation: 'ASM',
            employeeCode: 'EMP-A033',
            territory: 'Lucknow',
            mobile: '9100000037',
            zoneId: 'zone-north',
            regionId: 'region-up',
            areaId: 'area-lko',
            children: [
              {
                email: 'dm-lko-c@seed.roinet.com',
                name: 'DM Lucknow Central',
                designation: 'DM',
                employeeCode: 'EMP-D045',
                territory: 'LKO Central',
                mobile: '9100000055',
                zoneId: 'zone-north',
                regionId: 'region-up',
                areaId: 'area-lko-c',
                children: [],
              },
              {
                email: 'dm-lko-e@seed.roinet.com',
                name: 'DM Lucknow East',
                designation: 'DM',
                employeeCode: 'EMP-D046',
                territory: 'LKO East',
                mobile: '9100000056',
                zoneId: 'zone-north',
                regionId: 'region-up',
                areaId: 'area-lko-e',
                children: [],
              },
            ],
          },
          {
            email: 'asm-knp@seed.roinet.com',
            name: 'ASM Kanpur',
            designation: 'ASM',
            employeeCode: 'EMP-A034',
            territory: 'Kanpur',
            mobile: '9100000038',
            zoneId: 'zone-north',
            regionId: 'region-up',
            areaId: 'area-knp',
            children: [
              {
                email: 'dm-knp-c@seed.roinet.com',
                name: 'DM Kanpur City',
                designation: 'DM',
                employeeCode: 'EMP-D047',
                territory: 'KNP City',
                mobile: '9100000057',
                zoneId: 'zone-north',
                regionId: 'region-up',
                areaId: 'area-knp-c',
                children: [],
              },
              {
                email: 'dm-knp-r@seed.roinet.com',
                name: 'DM Kanpur Rural',
                designation: 'DM',
                employeeCode: 'EMP-D048',
                territory: 'KNP Rural',
                mobile: '9100000058',
                zoneId: 'zone-north',
                regionId: 'region-up',
                areaId: 'area-knp-r',
                children: [],
              },
            ],
          },
        ],
      },
    ],
  },
  // Extra RH under existing ZH-West
  {
    email: 'rh-guj@seed.roinet.com',
    name: 'Regional Head Gujarat',
    designation: 'RH',
    employeeCode: 'EMP-R015',
    territory: 'Gujarat',
    mobile: '9100000025',
    zoneId: 'zone-west',
    regionId: 'region-gj',
    children: [
      {
        email: 'asm-ahm@seed.roinet.com',
        name: 'ASM Ahmedabad',
        designation: 'ASM',
        employeeCode: 'EMP-A041',
        territory: 'Ahmedabad',
        mobile: '9100000039',
        zoneId: 'zone-west',
        regionId: 'region-gj',
        areaId: 'area-ahm',
        children: [
          {
            email: 'dm-ahm-n@seed.roinet.com',
            name: 'DM Ahmedabad North',
            designation: 'DM',
            employeeCode: 'EMP-D051',
            territory: 'AHM North',
            mobile: '9100000061',
            zoneId: 'zone-west',
            regionId: 'region-gj',
            areaId: 'area-ahm-n',
            children: [],
          },
          {
            email: 'dm-ahm-s@seed.roinet.com',
            name: 'DM Ahmedabad South',
            designation: 'DM',
            employeeCode: 'EMP-D052',
            territory: 'AHM South',
            mobile: '9100000062',
            zoneId: 'zone-west',
            regionId: 'region-gj',
            areaId: 'area-ahm-s',
            children: [],
          },
        ],
      },
      {
        email: 'asm-srt@seed.roinet.com',
        name: 'ASM Surat',
        designation: 'ASM',
        employeeCode: 'EMP-A042',
        territory: 'Surat',
        mobile: '9100000040',
        zoneId: 'zone-west',
        regionId: 'region-gj',
        areaId: 'area-srt',
        children: [
          {
            email: 'dm-srt-c@seed.roinet.com',
            name: 'DM Surat City',
            designation: 'DM',
            employeeCode: 'EMP-D053',
            territory: 'SRT City',
            mobile: '9100000063',
            zoneId: 'zone-west',
            regionId: 'region-gj',
            areaId: 'area-srt-c',
            children: [],
          },
          {
            email: 'dm-srt-r@seed.roinet.com',
            name: 'DM Surat Rural',
            designation: 'DM',
            employeeCode: 'EMP-D054',
            territory: 'SRT Rural',
            mobile: '9100000064',
            zoneId: 'zone-west',
            regionId: 'region-gj',
            areaId: 'area-srt-r',
            children: [],
          },
        ],
      },
    ],
  },
  // Extra ASM under existing RH-MH
  {
    email: 'asm-pune@seed.roinet.com',
    name: 'ASM Pune',
    designation: 'ASM',
    employeeCode: 'EMP-A043',
    territory: 'Pune',
    mobile: '9100000071',
    zoneId: 'zone-west',
    regionId: 'region-mh',
    areaId: 'area-pune',
    children: [
      {
        email: 'dm-pune-e@seed.roinet.com',
        name: 'DM Pune East',
        designation: 'DM',
        employeeCode: 'EMP-D061',
        territory: 'Pune East',
        mobile: '9100000081',
        zoneId: 'zone-west',
        regionId: 'region-mh',
        areaId: 'area-pune-e',
        children: [],
      },
      {
        email: 'dm-pune-w@seed.roinet.com',
        name: 'DM Pune West',
        designation: 'DM',
        employeeCode: 'EMP-D062',
        territory: 'Pune West',
        mobile: '9100000082',
        zoneId: 'zone-west',
        regionId: 'region-mh',
        areaId: 'area-pune-w',
        children: [],
      },
    ],
  },
  // Extra DM under existing ASM-Mumbai
  {
    email: 'dm-mum-n@seed.roinet.com',
    name: 'DM Mumbai North',
    designation: 'DM',
    employeeCode: 'EMP-D071',
    territory: 'Mumbai North',
    mobile: '9100000091',
    zoneId: 'zone-west',
    regionId: 'region-mh',
    areaId: 'area-mumbai',
    children: [],
  },
];

/**
 * Walks the EXPANDED_HIERARCHY tree and creates User + SalesTeam records for each node.
 * Returns a map from node email → SalesTeam id.
 */
async function seedExpandedHierarchy(): Promise<void> {
  console.log('\n[EXP] Expanded hierarchy (multi-ZH/RH/ASM/DM/POSP)…');

  const seedPassword = await hash('Seed@1234');
  const nodeCount = { zh: 0, rh: 0, asm: 0, dm: 0 };
  const dmRecords: Array<{
    id: string;
    areaId: string;
    zoneId: string;
    regionId: string;
    email: string;
  }> = [];

  // Look up the NH, existing ZH, RH, ASM so we can set correct parent IDs
  const nhRecord = await prisma.salesTeam.findFirst({
    where: { designation: 'NATIONAL_HEAD' },
    select: { id: true },
  });
  const existingZhRecord = await prisma.salesTeam.findFirst({
    where: { designation: 'ZH', managerId: nhRecord?.id ?? undefined },
    select: { id: true },
  });
  const existingRhRecord = await prisma.salesTeam.findFirst({
    where: {
      designation: 'RH',
      managerId: existingZhRecord?.id ?? undefined,
    },
    select: { id: true },
  });
  const existingAsmRecord = await prisma.salesTeam.findFirst({
    where: {
      designation: 'ASM',
      managerId: existingRhRecord?.id ?? undefined,
    },
    select: { id: true },
  });
  const existingDmRecord = await prisma.salesTeam.findFirst({
    where: {
      designation: 'DM',
      managerId: existingAsmRecord?.id ?? undefined,
    },
    select: { id: true, areaId: true },
  });

  // Update existing ZH SalesTeam geo to zone-west (for filter consistency)
  if (existingZhRecord) {
    await prisma.salesTeam.update({
      where: { id: existingZhRecord.id },
      data: { zoneId: 'zone-west' },
    });
  }
  // Update existing RH SalesTeam geo
  if (existingRhRecord) {
    await prisma.salesTeam.update({
      where: { id: existingRhRecord.id },
      data: { zoneId: 'zone-west', regionId: 'region-mh' },
    });
  }
  // Update existing ASM SalesTeam geo
  if (existingAsmRecord) {
    await prisma.salesTeam.update({
      where: { id: existingAsmRecord.id },
      data: {
        zoneId: 'zone-west',
        regionId: 'region-mh',
        areaId: 'area-mumbai',
      },
    });
  }
  // Update existing DM SalesTeam geo and propagate to the POSPs it owns
  // (base POSPs are owned via asmId = existingDmRecord.id from seedPosp).
  if (existingDmRecord) {
    await prisma.salesTeam.update({
      where: { id: existingDmRecord.id },
      data: {
        zoneId: 'zone-west',
        regionId: 'region-mh',
        areaId: 'area-mumbai',
      },
    });
    await prisma.posp.updateMany({
      where: { asmId: existingDmRecord.id },
      data: {
        areaId: 'area-mumbai',
        zoneId: 'zone-west',
        regionId: 'region-mh',
      },
    });
    dmRecords.push({
      id: existingDmRecord.id,
      areaId: 'area-mumbai',
      zoneId: 'zone-west',
      regionId: 'region-mh',
      email: 'dm@roinet.com',
    });
  }

  // Upsert one node: creates User + SalesTeam, returns SalesTeam id
  async function upsertNode(
    node: HierarchyNodeDef,
    managerId: string | null,
  ): Promise<string> {
    // Idempotent user upsert keyed by email.
    const user = await prisma.user.upsert({
      where: { email: node.email },
      update: {
        role: node.designation === 'DM' ? 'DM' : node.designation,
        status: 'ACTIVE',
      },
      create: {
        email: node.email,
        passwordHash: seedPassword,
        role: node.designation === 'DM' ? 'DM' : node.designation,
        status: 'ACTIVE',
      },
      select: { id: true },
    });
    const userId = user.id;

    // Idempotent SalesTeam upsert keyed by userId. Also reconcile any stray
    // record that may already own this employeeCode under a different user.
    const byCode = await prisma.salesTeam.findUnique({
      where: { employeeCode: node.employeeCode },
      select: { id: true, userId: true },
    });
    if (byCode && byCode.userId !== userId) {
      await prisma.salesTeam.delete({ where: { id: byCode.id } });
    }

    const st = await prisma.salesTeam.upsert({
      where: { userId },
      update: {
        managerId,
        designation: node.designation,
        employeeCode: node.employeeCode,
        zoneId: node.zoneId,
        regionId: node.regionId ?? null,
        areaId: node.areaId ?? null,
      },
      create: {
        userId,
        name: node.name,
        employeeCode: node.employeeCode,
        designation: node.designation,
        territory: node.territory,
        mobile: node.mobile,
        email: node.email,
        joiningDate: new Date('2023-01-01'),
        status: 'ACTIVE',
        managerId,
        zoneName: node.territory,
        zoneId: node.zoneId,
        regionId: node.regionId ?? null,
        areaId: node.areaId ?? null,
      },
      select: { id: true },
    });
    const stId = st.id;

    if (node.designation === 'DM') {
      dmRecords.push({
        id: stId,
        areaId: node.areaId ?? stId,
        zoneId: node.zoneId,
        regionId: node.regionId ?? '',
        email: node.email,
      });
    }

    nodeCount[node.designation.toLowerCase() as keyof typeof nodeCount]++;
    return stId;
  }

  // Walk each top-level node and resolve its parent
  async function processNode(
    node: HierarchyNodeDef,
    parentId: string | null,
  ): Promise<void> {
    const stId = await upsertNode(node, parentId);
    for (const child of node.children) {
      await processNode(child, stId);
    }
  }

  // Determine parent for each top-level node by designation
  for (const node of EXPANDED_HIERARCHY) {
    let parentId: string | null = null;
    if (node.designation === 'ZH') {
      parentId = nhRecord?.id ?? null;
    } else if (node.designation === 'RH') {
      parentId = existingZhRecord?.id ?? null;
    } else if (node.designation === 'ASM') {
      parentId = existingRhRecord?.id ?? null;
    } else if (node.designation === 'DM') {
      parentId = existingAsmRecord?.id ?? null;
    }
    await processNode(node, parentId);
  }

  console.log(
    `  created  ZH:${nodeCount.zh} RH:${nodeCount.rh} ASM:${nodeCount.asm} DM:${nodeCount.dm}`,
  );

  // Create 5 POSPs per DM
  let pospCounter = 2000;
  let pospCreated = 0;
  for (const dm of dmRecords) {
    for (let i = 0; i < 5; i++) {
      const code = `POSP-EXP-${pospCounter++}`;
      const existingPosp = await prisma.posp.findUnique({
        where: { code },
        select: { id: true },
      });
      if (existingPosp) continue;

      const idx = pospCounter % 40;
      const fnames = [
        'Rajesh',
        'Sunita',
        'Aditya',
        'Kavita',
        'Mohan',
        'Sneha',
        'Arjun',
        'Deepika',
        'Karan',
        'Meera',
        'Sanjay',
        'Ritu',
        'Naveen',
        'Pooja',
        'Harish',
        'Geeta',
        'Ashok',
        'Lakshmi',
        'Vikram',
        'Anjali',
        'Rohit',
        'Priya',
        'Neha',
        'Sameer',
        'Bharat',
        'Amit',
        'Divya',
        'Suresh',
        'Rekha',
        'Manoj',
        'Anita',
        'Pradeep',
        'Swati',
        'Ramesh',
        'Kiran',
        'Vijay',
        'Pallavi',
        'Gaurav',
        'Shilpa',
        'Ravi',
      ];
      const lnames = [
        'Mehta',
        'Desai',
        'Kapoor',
        'Nair',
        'Pillai',
        'Reddy',
        'Bhatt',
        'Joshi',
        'Malhotra',
        'Saxena',
        'Verma',
        'Agarwal',
        'Khanna',
        'Goel',
        'Mishra',
        'Pandey',
        'Rao',
        'Sharma',
        'Kumar',
        'Iyer',
        'Singh',
        'Patel',
        'Bhatia',
        'Gupta',
        'Shah',
      ];
      const fname = fnames[idx % fnames.length];
      const lname = lnames[(idx * 3 + 7) % lnames.length];
      const name = `${fname} ${lname}`;
      const mobile = `96${String(10000000 + pospCounter).slice(-8)}`;
      const email = `exp.${code.toLowerCase().replace(/-/g, '.')}@example.com`;

      await prisma.posp.create({
        data: {
          code,
          name,
          mobile,
          email,
          joined: new Date(2023, pospCounter % 12, 1 + (pospCounter % 28)),
          active: pospCounter % 6 !== 0,
          asmId: dm.id,
          areaId: dm.areaId,
          zoneId: dm.zoneId,
          regionId: dm.regionId || null,
        },
      });
      pospCreated++;
    }
  }

  console.log(`  created  ${pospCreated} expanded POSPs (5 per DM)`);
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' Roinet CRM — Database Seed');
  console.log(
    ` Targets: ${SEED_TARGETS.customers} customers, ${SEED_TARGETS.posp} POSPs,`,
  );
  console.log(
    `          ${SEED_TARGETS.deals} deals, ${SEED_TARGETS.leads} leads`,
  );
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const users = await seedUsers();
  const salesTeam = await seedSalesTeam(users);
  const customers = await seedCustomers();
  const posps = await seedPosp(users);
  await seedDeals(posps, customers);
  await seedLeads(customers, salesTeam);
  await seedExpandedHierarchy();
  await backfillDealGeo();

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
  .catch((e) => {
    console.error('\n[SEED ERROR]', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
