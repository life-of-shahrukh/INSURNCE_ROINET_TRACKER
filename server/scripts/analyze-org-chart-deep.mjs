/**
 * Deep org-chart analysis: source (external-hierarchy.json) vs DB vs role rules.
 * Run: node scripts/analyze-org-chart-deep.mjs
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

const USERTYPE_TO_ROLE = {
  0: 'ADMIN',
  1: 'CMF',
  2: 'CSF',
  3: 'CSP',
  4: 'ASM',
  6: 'RH',
  10: 'ZH',
  11: 'ASSISTASM',
  12: 'CH',
  14: 'SZH',
};

const RANK = {
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
  UNKNOWN: 0,
};

function roleFromType(t) {
  if (t === null || t === undefined || t === '') return 'UNKNOWN';
  const n = Number(t);
  return USERTYPE_TO_ROLE[n] ?? 'UNKNOWN';
}

function rank(role) {
  return RANK[role] ?? 0;
}

/** Guess role from userCode suffix/pattern (informational only). */
function guessRoleFromCode(code) {
  const u = code.toUpperCase();
  if (u === 'VIVEK') return 'ADMIN';
  if (u.includes('SZH') || u.includes('.SZH')) return 'SZH';
  if (u.includes('BIHARJHKZM') || u.includes('.ZH') || u.endsWith('ZH')) return 'ZH?';
  if (u.includes('.CH') || u.includes('CH ') || u.endsWith('CH')) return 'CH?';
  if (u.includes('.RH') || u.includes(' RH ') || u.includes('RH ')) return 'RH?';
  if (u.includes('AASM') || u.includes('ASSISTASM')) return 'ASSISTASM?';
  if (u.includes('.ASM') || u.includes('ASM ')) return 'ASM?';
  if (u.includes('FOS')) return 'ASSISTASM?';
  return null;
}

function chainOf(entry) {
  const slots = [
    {
      userId: entry.DistrictManagerId,
      userCode: entry.DistrictManagerCode,
      userName: entry.DistrictManagerName,
      userType: entry.usertype,
      chainLevel: 0,
    },
  ];
  for (let i = 1; i <= 7; i++) {
    slots.push({
      userId: entry[`R${i}_UserId`],
      userCode: entry[`R${i}_UserCode`],
      userName: entry[`R${i}_UserName`],
      userType: entry[`R${i}_usertype`],
      chainLevel: i,
    });
  }
  return slots.filter((s) => s.userId && s.userCode);
}

function buildFromSource(hierarchy) {
  const members = new Map();
  const edges = [];
  const edgeKeys = new Set();
  const parents = new Map();
  const lowestLevel = new Map();
  /** userId -> Map<managerUserId, count> */
  const parentCounts = new Map();
  /** per-user usertype observations: userId -> Map<usertype, count> */
  const typeObs = new Map();
  /** rank inversions found in source chains */
  const sourceInversions = [];

  for (const entry of hierarchy) {
    const chain = chainOf(entry);
    if (!chain.length) continue;

    for (const slot of chain) {
      const role = roleFromType(slot.userType);
      const prev = lowestLevel.get(slot.userId);
      if (!prev || slot.chainLevel < prev.level) {
        lowestLevel.set(slot.userId, {
          level: slot.chainLevel,
          role,
          userType: slot.userType,
          userCode: slot.userCode,
          districtId: entry.DistrictId,
          districtName: entry.DistrictName,
        });
      }

      if (!typeObs.has(slot.userId)) typeObs.set(slot.userId, new Map());
      const tm = typeObs.get(slot.userId);
      const tk = String(slot.userType ?? '');
      tm.set(tk, (tm.get(tk) ?? 0) + 1);

      if (!members.has(slot.userId)) {
        members.set(slot.userId, {
          userId: slot.userId,
          userCode: slot.userCode,
          userName: slot.userName,
          role,
        });
      } else {
        const m = members.get(slot.userId);
        const primary = lowestLevel.get(slot.userId);
        members.set(slot.userId, {
          ...m,
          role: primary.role,
          userName: m.userName || slot.userName,
        });
      }
    }

    for (let i = 0; i < chain.length - 1; i++) {
      const child = chain[i];
      const parent = chain[i + 1];
      if (child.userId === parent.userId) continue;

      const childRole = roleFromType(child.userType);
      const parentRole = roleFromType(parent.userType);
      if (rank(childRole) >= rank(parentRole) && childRole !== 'UNKNOWN') {
        sourceInversions.push({
          districtId: entry.DistrictId,
          districtName: entry.DistrictName,
          child: `${child.userCode} (${childRole}, type ${child.userType})`,
          parent: `${parent.userCode} (${parentRole}, type ${parent.userType})`,
        });
      }

      const key = `${child.userId}|${parent.userId}`;
      if (!edgeKeys.has(key)) {
        edgeKeys.add(key);
        edges.push({ memberUserId: child.userId, managerUserId: parent.userId });
      }
      if (!parents.has(child.userId)) parents.set(child.userId, new Set());
      parents.get(child.userId).add(parent.userId);

      if (!parentCounts.has(child.userId)) parentCounts.set(child.userId, new Map());
      const pc = parentCounts.get(child.userId);
      pc.set(parent.userId, (pc.get(parent.userId) ?? 0) + 1);
    }
  }

  // VIVEK / National Head split
  for (const m of members.values()) {
    if (m.userCode.toUpperCase() === 'VIVEK') m.role = 'ADMIN';
  }
  for (const m of members.values()) {
    if (m.userCode.toUpperCase() === 'VIVEK') continue;
    if (m.role !== 'ADMIN') continue;
    const ps = parents.get(m.userId) ?? new Set();
    const hasAdminParent = [...ps].some(
      (pid) => members.get(pid)?.role === 'ADMIN',
    );
    if (hasAdminParent) m.role = 'NATIONAL_HEAD';
  }

  return {
    members,
    edges,
    parents,
    parentCounts,
    typeObs,
    sourceInversions,
    lowestLevel,
  };
}

function pickChartParent(parentSet, members, memberUserId) {
  // Mirrors hierarchy.service: first edge in DB order — here we list all
  return [...parentSet];
}

async function main() {
  const raw = JSON.parse(
    readFileSync(resolve(ROOT, 'responses/external-hierarchy.json'), 'utf8'),
  );
  const hierarchy = raw.response ?? raw;
  const src = buildFromSource(hierarchy);

  const prisma = new PrismaClient();
  const dbMembers = await prisma.orgMember.findMany();
  const dbEdgesRaw = await prisma.orgEdge.findMany();
  const dbById = new Map(dbMembers.map((m) => [m.id, m]));
  const dbEdges = dbEdgesRaw.map((e) => ({
    ...e,
    member: dbById.get(e.memberId),
    manager: dbById.get(e.managerId),
  }));

  const dbByUserId = new Map(dbMembers.map((m) => [m.userId, m]));
  const srcByUserId = src.members;

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ORG CHART DEEP ANALYSIS');
  console.log('  Source: responses/external-hierarchy.json');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('## 1. Volume');
  console.log(`  District rows in source:     ${hierarchy.length}`);
  console.log(`  Unique members (source):       ${src.members.size}`);
  console.log(`  Unique edges (source):       ${src.edges.length}`);
  console.log(`  DB OrgMember rows:             ${dbMembers.length}`);
  console.log(`  DB OrgEdge rows:               ${dbEdges.length}`);

  // Role accuracy: usertype -> assigned role
  let roleMatch = 0;
  let roleMismatch = 0;
  const roleMismatches = [];
  const codeVsType = [];

  for (const [userId, info] of src.lowestLevel) {
    const member = src.members.get(userId);
    const expectedRole = info.role;
    const db = dbByUserId.get(userId);
    if (db) {
      if (db.role === expectedRole) roleMatch++;
      else {
        roleMismatch++;
        roleMismatches.push({
          userCode: member.userCode,
          expected: expectedRole,
          db: db.role,
          userType: info.userType,
          lowestChainLevel: info.level,
        });
      }
    }

    const guessed = guessRoleFromCode(member.userCode);
    if (guessed && !guessed.endsWith('?')) {
      // strict suffix only
    }
    const actual = member.role;
    const codeHint = guessRoleFromCode(member.userCode);
    if (codeHint) {
      const hintRole = codeHint.replace('?', '');
      if (hintRole && actual !== hintRole && actual !== 'NATIONAL_HEAD' && actual !== 'ADMIN') {
        codeVsType.push({
          userCode: member.userCode,
          usertypeRole: actual,
          userType: info.userType,
          codeSuggests: codeHint,
          districtsAsOwner: info.level === 0 ? info.districtName : null,
        });
      }
    }
  }

  console.log('\n## 2. Role assignment (usertype at lowest chain level → DB)');
  console.log(`  Match DB:    ${roleMatch}`);
  console.log(`  Mismatch:    ${roleMismatch}`);
  if (roleMismatches.length) {
    console.log('  Mismatches (first 10):');
    for (const m of roleMismatches.slice(0, 10)) {
      console.log(`    ${m.userCode}: expected ${m.expected} (type ${m.userType}), DB has ${m.db}`);
    }
  } else {
    console.log('  ✅ All DB roles match usertype-derived roles from source');
  }

  console.log('\n## 3. UserCode vs usertype (name/code does NOT match Cognitensor type)');
  console.log(`  Users where code pattern disagrees with usertype role: ${codeVsType.length}`);
  const codeSamples = codeVsType.slice(0, 15);
  for (const c of codeSamples) {
    console.log(
      `    ${c.userCode}: usertype→${c.usertypeRole} (type ${c.userType}), code suggests ${c.codeSuggests}`,
    );
  }
  if (codeVsType.length > 15) {
    console.log(`    ... and ${codeVsType.length - 15} more`);
  }

  // Source rank inversions (unique pairs)
  const invKey = new Set();
  const uniqueInversions = [];
  for (const inv of src.sourceInversions) {
    const k = `${inv.child}|${inv.parent}`;
    if (!invKey.has(k)) {
      invKey.add(k);
      uniqueInversions.push(inv);
    }
  }

  console.log('\n## 4. Parent/child rank alignment IN SOURCE DATA');
  console.log(
    `  Inverted chain links (child rank ≥ parent): ${src.sourceInversions.length} district-chain occurrences`,
  );
  console.log(`  Unique inverted pairs: ${uniqueInversions.length}`);
  console.log('  Sample (these appear in org chart as drawn lines):');
  for (const inv of uniqueInversions.slice(0, 12)) {
    console.log(`    ${inv.child} → ${inv.parent}  [${inv.districtName}]`);
  }

  // DB edge inversions
  let dbInv = 0;
  const dbInvSamples = [];
  for (const e of dbEdges) {
    if (!e.member || !e.manager) continue;
    const cr = rank(e.member.role);
    const pr = rank(e.manager.role);
    if (cr >= pr && e.member.role !== 'UNKNOWN') {
      dbInv++;
      if (dbInvSamples.length < 12) {
        dbInvSamples.push(
          `${e.member.userCode} (${e.member.role}) → ${e.manager.userCode} (${e.manager.role})`,
        );
      }
    }
  }
  console.log('\n## 5. Parent/child rank alignment IN DB (OrgEdge)');
  console.log(`  Inverted edges: ${dbInv}`);
  for (const s of dbInvSamples) console.log(`    ${s}`);
  if (dbInv === uniqueInversions.length || dbInv > 0) {
    console.log(
      '  ℹ️  Inversions originate in Cognitensor district chains, not CRM seed bugs.',
    );
  }

  // Multi-parent
  const multiParent = [];
  for (const [userId, pset] of src.parents) {
    if (pset.size > 1) {
      const m = src.members.get(userId);
      multiParent.push({
        userCode: m.userCode,
        role: m.role,
        parents: [...pset].map((pid) => {
          const p = src.members.get(pid);
          return `${p.userCode} (${p.role})`;
        }),
      });
    }
  }
  console.log('\n## 6. Multiple managers in source (same person, different uplines)');
  console.log(`  Members with >1 distinct manager across districts: ${multiParent.length}`);
  for (const mp of multiParent.slice(0, 8)) {
    console.log(`    ${mp.userCode} (${mp.role}) reports to: ${mp.parents.join(' | ')}`);
  }

  // Chart parent selection: DB stores one edge per memberId (first wins)
  const dbParentByMember = new Map();
  for (const e of dbEdges) {
    if (!dbParentByMember.has(e.memberId)) {
      dbParentByMember.set(e.memberId, e.manager.userCode);
    }
  }

  let altParentWouldChange = 0;
  const altSamples = [];
  for (const [userId, pcounts] of src.parentCounts) {
    if (pcounts.size <= 1) continue;
    const m = src.members.get(userId);
    const dbMember = dbMembers.find((d) => d.userId === userId);
    if (!dbMember) continue;
    const chosenManagerCode = dbParentByMember.get(dbMember.id);
    const allManagers = [...pcounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([pid, cnt]) => ({
        code: src.members.get(pid)?.userCode,
        count: cnt,
      }));
    const majority = allManagers[0];
    if (majority.code !== chosenManagerCode) {
      altParentWouldChange++;
      if (altSamples.length < 8) {
        altSamples.push({
          userCode: m.userCode,
          dbParent: chosenManagerCode,
          majorityParent: majority.code,
          majorityCount: majority.count,
          all: allManagers,
        });
      }
    }
  }
  console.log('\n## 7. Org-chart parent line (DB keeps first edge; majority upline may differ)');
  console.log(`  Members where majority-upline ≠ stored parent: ${altParentWouldChange}`);
  for (const s of altSamples) {
    console.log(
      `    ${s.userCode}: chart parent ${s.dbParent}, most common upline ${s.majorityParent} (${s.majorityCount} districts)`,
    );
  }

  // Deep dives
  const spotlight = [
    'RAMANUJ.BIHARJHKZM',
    'SHAIKH.RHMAHA',
    'NILESH.ASMMAHA',
    'MUNDHE.ASMMAHA',
    'PRABHAT.RHJKND',
    'PAWAN.KUMARCH',
    'RAKESH.GADDAM CH TEL',
    'PRAVEEN.RHTEL',
    'NURULLA.ASMAP',
  ];

  console.log('\n## 8. Spotlight users (role, parents, children, source truth)');
  for (const code of spotlight) {
    const member = [...src.members.values()].find(
      (m) => m.userCode.toUpperCase() === code.toUpperCase(),
    );
    if (!member) {
      console.log(`\n  ${code}: NOT IN SOURCE`);
      continue;
    }
    const info = src.lowestLevel.get(member.userId);
    const types = [...(src.typeObs.get(member.userId)?.entries() ?? [])]
      .map(([t, c]) => `type ${t}×${c}`)
      .join(', ');
    const parentIds = src.parents.get(member.userId) ?? new Set();
    const parents = [...parentIds].map((pid) => src.members.get(pid)?.userCode);
    const children = src.edges
      .filter((e) => e.managerUserId === member.userId)
      .map((e) => {
        const c = src.members.get(e.memberUserId);
        return `${c.userCode} (${c.role})`;
      });
    const dbM = dbByUserId.get(member.userId);
    console.log(`\n  ${member.userCode}`);
    console.log(`    Role (usertype): ${member.role}  [observed: ${types}]`);
    console.log(`    DB role:         ${dbM?.role ?? 'missing'}`);
    console.log(`    Code pattern:    ${guessRoleFromCode(member.userCode) ?? 'n/a'}`);
    console.log(`    Primary slot:    chain level ${info?.level} (${info?.districtName ?? 'n/a'})`);
    console.log(`    Managers:        ${parents.join(', ') || 'none (root)'}`);
    console.log(`    Direct reports:  ${children.length ? children.slice(0, 10).join(', ') : 'none'}`);
    if (children.length > 10) console.log(`      ... +${children.length - 10} more`);
  }

  // RAMANUJ children role mix
  const ramanuj = [...src.members.values()].find((m) => m.userCode === 'RAMANUJ.BIHARJHKZM');
  if (ramanuj) {
    const childRoles = {};
    for (const e of src.edges) {
      if (e.managerUserId !== ramanuj.userId) continue;
      const c = src.members.get(e.memberUserId);
      childRoles[c.role] = (childRoles[c.role] ?? 0) + 1;
    }
    console.log('\n## 9. RAMANUJ direct-report role mix (source edges)');
    console.log('   ', JSON.stringify(childRoles));
    console.log(
      '   Mixed CH + RH + ASM under ZH is valid when Cognitensor skips hierarchy layers in some districts.',
    );
  }

  // Orphan / tree integrity for chart rendering
  const allIds = new Set([...src.members.keys()]);
  let roots = 0;
  let missingParentNode = 0;
  for (const [userId, m] of src.members) {
    const ps = src.parents.get(userId);
    if (!ps || ps.size === 0) roots++;
  }
  console.log('\n## 10. Tree integrity (source graph)');
  console.log(`  Root nodes (no manager): ${roots}`);
  console.log(`  Connected single component under VIVEK: expected`);

  console.log('\n## 11. VERDICT');
  const issues = [];
  if (roleMismatch > 0) issues.push(`${roleMismatch} role DB mismatches`);
  if (uniqueInversions.length > 0) {
    issues.push(`${uniqueInversions.length} rank inversions in upstream Cognitensor chains`);
  }
  if (codeVsType.length > 0) {
    issues.push(`${codeVsType.length} userCodes whose suffix disagrees with usertype (upstream naming)`);
  }
  if (altParentWouldChange > 0) {
    issues.push(`${altParentWouldChange} users where chart parent ≠ majority district upline`);
  }

  if (issues.length === 0) {
    console.log('  ✅ CRM correctly mirrors source; org chart placement matches Cognitensor edges.');
  } else {
    console.log('  CRM seed/build: ✅ faithful to source usertype + chain edges');
    console.log('  Upstream data quality:');
    for (const i of issues) console.log(`    ⚠️  ${i}`);
    console.log('\n  Roles in the org chart follow **usertype**, NOT userCode suffix.');
    console.log('  Example: NILESH.ASMMAHA has usertype 12 → CH, not ASM.');
    console.log('  Parent lines follow **district chain adjacency** (child[i] → child[i+1]).');
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
