import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const [
    posps,
    pospsWithGeo,
    users,
    orgMembers,
    orgEdges,
    districtChains,
    leads,
    deals,
    customers,
    announcements,
    salesTeam,
  ] = await Promise.all([
    prisma.posp.count(),
    prisma.posp.count({
      where: { externalId: { not: null }, districtId: { not: null } },
    }),
    prisma.user.count(),
    prisma.orgMember.count(),
    prisma.orgEdge.count(),
    prisma.districtChain.count(),
    prisma.lead.count(),
    prisma.deal.count(),
    prisma.customer.count(),
    prisma.announcement.count(),
    prisma.salesTeam.count(),
  ]);

  const demoUsers = await prisma.user.findMany({
    where: {
      email: {
        in: [
          'superadmin@roinet.com',
          'posp@roinet.com',
          'dm@roinet.com',
          'asm@roinet.com',
          'shivraj.wanole@roinet.in',
        ],
      },
    },
    select: { email: true, role: true, pospId: true, status: true },
    orderBy: { email: 'asc' },
  });

  const samplePosp = await prisma.posp.findFirst({
    where: { code: 'CSP023057' },
    select: { code: true, name: true, districtId: true, externalId: true },
  });

  console.log(
    JSON.stringify(
      {
        ok: posps >= 200 && users >= 7 && orgMembers > 0,
        masterData: { posps, pospsWithGeo, orgMembers, orgEdges, districtChains },
        demoAccounts: { users, salesTeam, demoUsers },
        crmPipeline: { customers, leads, deals },
        announcements,
        samplePosp,
        notes: [
          posps < 200 ? 'POSP count low — run: npm run seed:all' : null,
          users < 7 ? 'Demo users missing — run: npm run db:seed' : null,
          orgMembers === 0 ? 'Org graph empty — run: npm run seed:all' : null,
          leads === 0 && deals === 0
            ? 'CRM pipeline empty (expected after seed:crm with TARGETS=0)'
            : null,
        ].filter(Boolean),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
