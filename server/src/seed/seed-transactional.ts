/**
 * Resets app-owned CRM data (customers, leads, deals).
 * Customers, leads, and deals are wiped and left empty for manual / in-app testing.
 * Does NOT touch org graph, synced POSPs, or hierarchy users.
 *
 * Run: npm run seed:crm
 */
import 'dotenv/config';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  buildCustomerSeed,
  buildDealSeed,
  buildLeadSeed,
} from '../../prisma/seed-generators';
import {
  buildDistrictGeoMap,
  enrichGeoWithStateName,
  geoForDistrict,
  loadDistrictOwnerSalesTeamMap,
  readDistrictSnapshot,
  readStateNameMap,
} from './geo-seed.util';

const prisma = new PrismaClient({ log: ['warn', 'error'] });

const TARGETS: { customers: number; deals: number; leads: number } = {
  customers: 0,
  deals: 0,
  leads: 0,
};

async function wipeTransactionalData(): Promise<void> {
  console.log('\n🗑️  Phase 0: wiping leads, deals, customers…');
  // Leads reference deals (convertedToDealId) — delete leads before deals.
  const leads = await prisma.lead.deleteMany();
  const deals = await prisma.deal.deleteMany();
  const customers = await prisma.customer.deleteMany();
  console.log(
    `  deleted leads=${leads.count} deals=${deals.count} customers=${customers.count}`,
  );
}

interface DistrictBucket {
  districtId: string;
  pospIds: string[];
}

async function loadContext(): Promise<{
  districtBuckets: DistrictBucket[];
  districtMap: ReturnType<typeof buildDistrictGeoMap>;
  stateNames: ReturnType<typeof readStateNameMap>;
  ownerByDistrict: Map<string, string>;
}> {
  const posps = await prisma.posp.findMany({
    where: {
      externalId: { not: null },
      districtId: { not: null },
      active: true,
    },
    select: { id: true, districtId: true },
  });

  if (posps.length === 0) {
    throw new Error(
      'No synced POSPs with districtId found — run npm run seed:all first',
    );
  }

  const byDistrict = new Map<string, string[]>();
  for (const p of posps) {
    const did = p.districtId as string;
    const arr = byDistrict.get(did) ?? [];
    arr.push(p.id);
    byDistrict.set(did, arr);
  }

  const districtBuckets: DistrictBucket[] = [...byDistrict.entries()].map(
    ([districtId, pospIds]) => ({ districtId, pospIds }),
  );

  const districtRows = readDistrictSnapshot();
  const districtMap = buildDistrictGeoMap(districtRows);
  const stateNames = readStateNameMap();
  const ownerByDistrict = await loadDistrictOwnerSalesTeamMap(prisma);

  console.log(
    `\n📦 Context: ${posps.length} synced POSPs across ${districtBuckets.length} districts`,
  );
  return { districtBuckets, districtMap, stateNames, ownerByDistrict };
}

async function seedCustomers(
  districtBuckets: DistrictBucket[],
  districtMap: ReturnType<typeof buildDistrictGeoMap>,
  stateNames: ReturnType<typeof readStateNameMap>,
): Promise<Array<{ id: string; districtId: string }>> {
  console.log(`\n👥 Phase 1: seeding ${TARGETS.customers} customers…`);

  const created: Array<{ id: string; districtId: string }> = [];
  let index = 0;

  while (created.length < TARGETS.customers) {
    const bucket = districtBuckets[index % districtBuckets.length];
    const baseGeo = geoForDistrict(bucket.districtId, districtMap);
    if (!baseGeo) {
      index++;
      continue;
    }
    const geo = enrichGeoWithStateName(baseGeo, stateNames);
    const seed = buildCustomerSeed(index);

    const customer = await prisma.customer.create({
      data: {
        name: seed.name,
        mobile: seed.mobile,
        email: seed.email,
        kycStatus: seed.kycStatus,
        source: seed.source,
        stateId: geo.stateId,
        stateName: geo.stateName,
        districtId: geo.districtId,
        districtName: geo.districtName,
        cityName: geo.districtName,
      },
      select: { id: true },
    });

    created.push({ id: customer.id, districtId: bucket.districtId });
    index++;
  }

  console.log(`  ✓ created ${created.length} customers`);
  return created;
}

async function seedDeals(
  districtBuckets: DistrictBucket[],
  customers: Array<{ id: string; districtId: string; name?: string }>,
  districtMap: ReturnType<typeof buildDistrictGeoMap>,
): Promise<number> {
  console.log(`\n📄 Phase 2: seeding ${TARGETS.deals} deals…`);

  const customersByDistrict = new Map<string, typeof customers>();
  for (const c of customers) {
    const arr = customersByDistrict.get(c.districtId) ?? [];
    arr.push(c);
    customersByDistrict.set(c.districtId, arr);
  }

  const allPospIds = districtBuckets.flatMap((b) => b.pospIds);
  const batch: Prisma.DealCreateManyInput[] = [];

  for (let i = 0; i < TARGETS.deals; i++) {
    const bucket = districtBuckets[i % districtBuckets.length];
    const pospId = allPospIds[i % allPospIds.length];
    const geo = geoForDistrict(bucket.districtId, districtMap);
    if (!geo) continue;

    const districtCustomers = customersByDistrict.get(bucket.districtId) ?? [];
    const customer =
      districtCustomers.length > 0
        ? districtCustomers[i % districtCustomers.length]
        : null;

    const seed = buildDealSeed(
      i,
      pospId,
      customer?.name ?? `Customer ${i + 1}`,
    );

    batch.push({
      pospId: seed.pospId,
      customerId: customer?.id ?? null,
      customerName: seed.customerName,
      policy: seed.policy,
      sum: seed.sum,
      premium: seed.premium,
      coa: seed.coa,
      coaType: 'AMOUNT',
      coaAmount: seed.coa,
      margin: seed.margin,
      status: seed.status,
      expected: seed.expected,
      proposal: seed.proposal,
      policyNo: seed.policyNo,
      issued: seed.issued,
      remarks: seed.remarks,
      zoneId: geo.zoneId,
      regionId: geo.regionId,
      districtId: geo.districtId,
    });
  }

  const result = await prisma.deal.createMany({ data: batch });
  console.log(`  ✓ created ${result.count} deals`);
  return result.count;
}

async function seedLeads(
  customers: Array<{ id: string; districtId: string }>,
  districtMap: ReturnType<typeof buildDistrictGeoMap>,
  ownerByDistrict: Map<string, string>,
): Promise<number> {
  console.log(`\n🎯 Phase 3: seeding ${TARGETS.leads} leads…`);

  const batch: Prisma.LeadCreateManyInput[] = [];

  for (let i = 0; i < TARGETS.leads && i < customers.length; i++) {
    const customer = customers[i];
    const geo = geoForDistrict(customer.districtId, districtMap);
    if (!geo) continue;

    const assignedToId = ownerByDistrict.get(customer.districtId) ?? null;
    const seed = buildLeadSeed(i, customer.id, assignedToId);

    batch.push({
      customerId: seed.customerId,
      assignedToId: seed.assignedToId,
      product: seed.product,
      productSubType: seed.productSubType,
      estimatedPremium: seed.estimatedPremium,
      estimatedSum: seed.estimatedSum,
      closureTimeline: seed.closureTimeline,
      expectedCloseDate: seed.expectedCloseDate,
      status: seed.status,
      source: seed.source,
      remarks: seed.remarks,
      zoneId: geo.zoneId,
      regionId: geo.regionId,
      districtId: geo.districtId,
    });
  }

  const result = await prisma.lead.createMany({ data: batch });
  console.log(`  ✓ created ${result.count} leads`);
  return result.count;
}

/** Count CRM rows in districts covered by a member's userCode. */
async function countInMemberTerritory(userCode: string): Promise<{
  districts: number;
  customers: number;
  deals: number;
  leads: number;
}> {
  const member = await prisma.orgMember.findFirst({
    where: { userCode },
    select: { id: true },
  });
  if (!member) {
    return { districts: 0, customers: 0, deals: 0, leads: 0 };
  }

  const chains = await prisma.districtChain.findMany({
    where: { memberId: member.id },
    select: { districtId: true },
    distinct: ['districtId'],
  });
  const districtIds = chains.map((c) => c.districtId);
  if (districtIds.length === 0) {
    return { districts: 0, customers: 0, deals: 0, leads: 0 };
  }

  const [customers, deals, leads] = await Promise.all([
    prisma.customer.count({ where: { districtId: { in: districtIds } } }),
    prisma.deal.count({ where: { districtId: { in: districtIds } } }),
    prisma.lead.count({ where: { districtId: { in: districtIds } } }),
  ]);

  return {
    districts: districtIds.length,
    customers,
    deals,
    leads,
  };
}

async function printVerificationSummary(): Promise<void> {
  console.log('\n📊 Phase 4: territory sample counts');

  const samples = [
    { label: 'ZH (HARI.DUTT)', code: 'HARI.DUTT' },
    { label: 'DM (MUNDHE.ASMMAHA)', code: 'MUNDHE.ASMMAHA' },
  ];

  for (const s of samples) {
    const c = await countInMemberTerritory(s.code);
    console.log(
      `  ${s.label.padEnd(22)} districts=${c.districts} customers=${c.customers} deals=${c.deals} leads=${c.leads}`,
    );
  }

  const posp = await prisma.posp.findUnique({
    where: { code: 'CSP023057' },
    select: { id: true },
  });
  if (posp) {
    const deals = await prisma.deal.count({ where: { pospId: posp.id } });
    console.log(`  POSP (CSP023057)         deals=${deals}`);
  }

  const totals = await Promise.all([
    prisma.customer.count(),
    prisma.deal.count(),
    prisma.lead.count(),
  ]);
  console.log(
    `\n  Totals: customers=${totals[0]} deals=${totals[1]} leads=${totals[2]}`,
  );
}

async function main(): Promise<void> {
  console.log('🚀 seed:crm — wipe customers, leads, deals (all left empty)');
  await wipeTransactionalData();

  if (TARGETS.deals === 0) {
    console.log('\n  No deals to seed (TARGETS.deals = 0).');
    await printVerificationSummary();
    console.log('\n✅ CRM reset complete.');
    return;
  }

  const ctx = await loadContext();
  const customerRows: Array<{ id: string; districtId: string; name: string }> =
    [];

  if (TARGETS.customers > 0) {
    const customers = await seedCustomers(
      ctx.districtBuckets,
      ctx.districtMap,
      ctx.stateNames,
    );
    const rows = await prisma.customer.findMany({
      where: { id: { in: customers.map((c) => c.id) } },
      select: { id: true, districtId: true, name: true },
    });
    for (const c of rows) {
      if (c.districtId) {
        customerRows.push({
          id: c.id,
          districtId: c.districtId,
          name: c.name,
        });
      }
    }
  } else {
    console.log('\n👥 Customers: skipped (left empty)');
  }

  await seedDeals(ctx.districtBuckets, customerRows, ctx.districtMap);

  if (TARGETS.leads > 0) {
    const customers = await prisma.customer.findMany({
      select: { id: true, districtId: true },
    });
    const leadCustomers = customers
      .filter((c): c is { id: string; districtId: string } => !!c.districtId)
      .map((c) => ({ id: c.id, districtId: c.districtId }));
    await seedLeads(leadCustomers, ctx.districtMap, ctx.ownerByDistrict);
  } else {
    console.log('\n🎯 Leads: skipped (left empty)');
  }

  await printVerificationSummary();
  console.log('\n✅ CRM reset complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
