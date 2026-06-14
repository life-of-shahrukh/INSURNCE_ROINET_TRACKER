/**
 * API integration test for Deal Modal fixes.
 * Run: node api-test.mjs
 */

const BASE = 'http://localhost:8000';
let cookies = '';
let pass = 0, fail = 0;

async function req(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookies) headers['Cookie'] = cookies;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) cookies = setCookie.split(';')[0];
  let data;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, ok: res.ok, data };
}

function ok(label, cond, detail = '') {
  const icon = cond ? '✅ PASS' : '❌ FAIL';
  console.log(`  ${icon}  ${label}${detail ? '  |  ' + detail : ''}`);
  cond ? pass++ : fail++;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. LOGIN (user exists from prior run)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n╔══ 1. Login POSP ════════════════════════════════════════════╗');
{
  const r = await req('POST', '/api/auth/login', {
    email: 'arjun.sharma@test.com',
    password: 'Test@1234',
  });
  ok('HTTP 200', r.status === 200, `got ${r.status}`);
  ok('role = POSP', r.data?.role === 'POSP', `role=${r.data?.role}`);
  ok('pospId present', !!r.data?.pospId, `pospId=${r.data?.pospId}`);
  ok('cookie set', !!cookies);
  var pospId = r.data?.pospId;
}
const pospSession = cookies;

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET PROFILE — POSP name for "Issued By" pre-fill
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n╔══ 2. GET /api/profile (POSP name pre-fill) ════════════════╗');
{
  const r = await req('GET', '/api/profile');
  ok('HTTP 200', r.status === 200, `got ${r.status}`);
  ok('posp.name present', !!r.data?.posp?.name, `name="${r.data?.posp?.name}"`);
  ok('posp.code = POSP001', r.data?.posp?.code === 'POSP001', `code=${r.data?.posp?.code}`);
  ok('pospId matches login', r.data?.posp?.id === pospId,
    `profile.posp.id=${r.data?.posp?.id}  login.pospId=${pospId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. CREATE CUSTOMER (new mobile)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n╔══ 3. Create Customer ═══════════════════════════════════════╗');
var customerId;
{
  const r = await req('POST', '/api/customers', {
    name: 'Rahul Verma', mobile: '9000011111',
    email: 'rahul@example.com', source: 'Walk-in',
  });
  ok('HTTP 201', r.status === 201, `got ${r.status}`);
  ok('id present', !!r.data?.id);
  ok('mobile stored', r.data?.mobile === '9000011111');
  customerId = r.data?.id;
  console.log(`     → customerId: ${customerId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. CUSTOMER MOBILE DEDUP — same mobile must update, not insert
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n╔══ 4. Customer Mobile Dedup (upsert by mobile) ══════════════╗');
{
  const r = await req('POST', '/api/customers', {
    name: 'Rahul Verma Updated', mobile: '9000011111',
    email: 'rahul.updated@example.com',
  });
  ok('HTTP 200/201', [200, 201].includes(r.status), `got ${r.status}`);
  ok('Same record returned (no duplicate)', r.data?.id === customerId,
    `returned=${r.data?.id}  original=${customerId}`);
  ok('Name updated', r.data?.name === 'Rahul Verma Updated', `name="${r.data?.name}"`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. CREATE DEAL — POSP (auto pospId forced, proposal auto-generated)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n╔══ 5. Create Deal — POSP role (auto pospId + proposal) ══════╗');
var dealId, generatedProposal;
{
  const r = await req('POST', '/api/deals', {
    // pospId omitted → server forces POSP's own pospId
    // proposal omitted → backend generates PRP-YYYY-XXXXXX
    customer: 'Rahul Verma Updated',
    customerId,
    policy: 'Life',
    sum: 5000000,
    premium: 45000,
    coa: 6000,
    margin: 3000,
    status: 'W',
    expected: '2026-09-30',
    remarks: 'API integration test',
  });
  ok('HTTP 201', r.status === 201, `got ${r.status}`);
  ok('proposal auto-generated', /^PRP-\d{4}-\d{6}$/.test(r.data?.proposal ?? ''),
    `proposal="${r.data?.proposal}"`);
  ok('pospId = own pospId (server-forced)', r.data?.pospId === pospId,
    `deal.pospId=${r.data?.pospId}  user.pospId=${pospId}`);
  ok('customerId linked (FK)', r.data?.customerId === customerId,
    `deal.customerId=${r.data?.customerId}`);
  dealId = r.data?.id;
  generatedProposal = r.data?.proposal;
  console.log(`     → dealId: ${dealId}`);
  console.log(`     → proposal: ${generatedProposal}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. CREATE DEAL — missing required fields → 400
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n╔══ 6. Validation — missing required fields → 400 ════════════╗');
{
  const r = await req('POST', '/api/deals', {
    customer: 'X', policy: 'Life',
    // missing sum, premium, coa, margin, status, expected
  });
  ok('HTTP 400 (class-validator rejects)', r.status === 400, `got ${r.status}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. GET DEALS — POSP sees their own deal
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n╔══ 7. GET /api/deals (POSP scoped) ══════════════════════════╗');
{
  const r = await req('GET', '/api/deals?page=1&pageSize=20');
  ok('HTTP 200', r.status === 200, `got ${r.status}`);
  ok('data array', Array.isArray(r.data?.data), `type=${typeof r.data?.data}`);
  ok('created deal present in list', r.data?.data?.some(d => d.id === dealId),
    `looking for ${dealId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. UPDATE DEAL — set policyNo + issued (edit mode)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n╔══ 8. PATCH /api/deals/:id — policyNo + issued (edit mode) ══╗');
{
  const r = await req('PATCH', `/api/deals/${dealId}`, {
    policyNo: 'POL-2026-APITEST01',
    issued: '2026-06-14',
  });
  ok('HTTP 200', r.status === 200, `got ${r.status}`);
  ok('policyNo updated', r.data?.policyNo === 'POL-2026-APITEST01',
    `policyNo="${r.data?.policyNo}"`);
  ok('issued date set', !!r.data?.issued, `issued=${r.data?.issued}`);
  ok('proposal unchanged', r.data?.proposal === generatedProposal,
    `proposal="${r.data?.proposal}"`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. CREATE LEAD
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n╔══ 9. POST /api/leads — create lead ═════════════════════════╗');
var leadId;
{
  const r = await req('POST', '/api/leads', {
    customerId,
    product: 'LIFE',
    estimatedPremium: 12000,
    closureTimeline: 'THIS_MONTH',
    source: 'API Test',
    remarks: 'Integration test lead',
  });
  ok('HTTP 201', r.status === 201, `got ${r.status}`);
  ok('customerId linked', r.data?.customerId === customerId, `customerId=${r.data?.customerId}`);
  ok('status defaults to NEW', r.data?.status === 'NEW', `status=${r.data?.status}`);
  ok('product = LIFE', r.data?.product === 'LIFE', `product=${r.data?.product}`);
  leadId = r.data?.id;
  console.log(`     → leadId: ${leadId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. GET LEADS — POSP sees their lead
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n╔══ 10. GET /api/leads ════════════════════════════════════════╗');
{
  const r = await req('GET', '/api/leads?page=1&pageSize=20');
  ok('HTTP 200', r.status === 200, `got ${r.status}`);
  ok('data array', Array.isArray(r.data?.data), `type=${typeof r.data?.data}`);
  ok('lead present in list', r.data?.data?.some(d => d.id === leadId),
    `leadId=${leadId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. DUPLICATE MOBILE — second customer with same number → returns same record
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n╔══ 11. Duplicate mobile unique index integrity ════════════════╗');
{
  const r = await req('POST', '/api/customers', {
    name: 'Completely Different Name',
    mobile: '9000011111', // same as test 3
  });
  ok('No duplicate created (same id)', r.data?.id === customerId,
    `returned=${r.data?.id}  expected=${customerId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. AUTH — unauthenticated access rejected
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n╔══ 12. Auth guard — no cookie → 401 ═════════════════════════╗');
{
  cookies = ''; // clear cookie
  const r = await req('GET', '/api/deals');
  ok('HTTP 401 (unauthenticated rejected)', r.status === 401, `got ${r.status}`);
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(62));
console.log(`  RESULTS:  ✅ ${pass} passed   ❌ ${fail} failed   (${pass + fail} total)`);
console.log('═'.repeat(62));
if (fail > 0) process.exit(1);
