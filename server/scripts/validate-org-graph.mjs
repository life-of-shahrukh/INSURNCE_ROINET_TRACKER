/**
 * Validates the persisted org graph (OrgMember + OrgEdge + DistrictChain).
 * Run: node scripts/validate-org-graph.mjs
 */
import { PrismaClient } from '@prisma/client';

const ORG_RANK = {
  ADMIN: 100,
  NATIONAL_HEAD: 95,
  SZH: 90,
  ZH: 80,
  CH: 70,
  RH: 60,
  ASSISTASM: 45,
  ASM: 40,
  CSF: 30,
  CMF: 25,
  CSP: 20,
  POSP: 0,
  UNKNOWN: 0,
};

const prisma = new PrismaClient();

function rank(role) {
  return ORG_RANK[role] ?? 0;
}

async function main() {
  const [members, edges, chains, pospCount] = await Promise.all([
    prisma.orgMember.findMany({
      select: { id: true, userCode: true, userName: true, role: true },
    }),
    prisma.orgEdge.findMany({
      select: { memberId: true, managerId: true },
    }),
    prisma.districtChain.count(),
    prisma.posp.count({ where: { active: true, districtId: { not: null } } }),
  ]);

  const byId = new Map(members.map((m) => [m.id, m]));
  const parentOf = new Map();
  for (const e of edges) {
    if (!parentOf.has(e.memberId)) parentOf.set(e.memberId, e.managerId);
  }

  let roots = 0;
  let missingParent = 0;
  let rankInversions = 0;
  const inversionSamples = [];

  for (const m of members) {
    const parentId = parentOf.get(m.id);
    if (!parentId) {
      roots++;
      continue;
    }
    const parent = byId.get(parentId);
    if (!parent) {
      missingParent++;
      continue;
    }
    if (rank(m.role) >= rank(parent.role) && m.role !== 'UNKNOWN') {
      rankInversions++;
      if (inversionSamples.length < 10) {
        inversionSamples.push({
          child: `${m.userCode} (${m.role})`,
          parent: `${parent.userCode} (${parent.role})`,
        });
      }
    }
  }

  const codes = new Map();
  let duplicateCodes = 0;
  for (const m of members) {
    const key = m.userCode.toLowerCase();
    codes.set(key, (codes.get(key) ?? 0) + 1);
    if (codes.get(key) === 2) duplicateCodes++;
  }

  console.log('=== Org graph validation ===');
  console.log(`Members: ${members.length}`);
  console.log(`Edges: ${edges.length}`);
  console.log(`District chains: ${chains}`);
  console.log(`Active POSPs with district: ${pospCount}`);
  console.log(`Root nodes (no manager edge): ${roots}`);
  console.log(`Edges to missing manager: ${missingParent}`);
  console.log(`Rank inversions (child rank >= parent): ${rankInversions}`);
  if (inversionSamples.length > 0) {
    console.log('Sample inversions:');
    for (const s of inversionSamples) {
      console.log(`  ${s.child} → ${s.parent}`);
    }
  }
  console.log(`Duplicate userCodes: ${duplicateCodes}`);

  const issues = [];
  if (roots > 1) issues.push(`multiple roots (${roots})`);
  if (missingParent > 0) issues.push(`${missingParent} orphan edges`);
  if (rankInversions > 0) issues.push(`${rankInversions} rank inversions`);
  if (duplicateCodes > 0) issues.push(`${duplicateCodes} duplicate codes`);

  if (issues.length === 0) {
    console.log('\nResult: PASS (no structural issues)');
  } else {
    console.log(`\nResult: WARN — ${issues.join(', ')}`);
    console.log(
      'Rank inversions come from upstream Cognitensor data; dashboard filters exclude them from cascade drill-down.',
    );
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
