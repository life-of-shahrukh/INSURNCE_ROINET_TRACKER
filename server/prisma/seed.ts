import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ─── helpers ─────────────────────────────────────────────────────────────────
const hash = (pwd: string) => bcrypt.hash(pwd, 10);

// ─── seed modules ────────────────────────────────────────────────────────────

async function seedUsers() {
  console.log('\n[1/4] Users…');

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
    // Delete and re-create to avoid any partial unique index issues on MS SQL
    await prisma.user.deleteMany({ where: { email: u.email } });
    const created = await prisma.user.create({
      data: {
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

async function seedCustomers() {
  console.log('\n[2/4] Customers…');

  // Check if Customer table exists
  try {
    await prisma.customer.count();
  } catch {
    console.log('  ⚠  Customer table not found — skipping');
    return [];
  }

  const defs = [
    { name: 'Rajesh Mehta',      mobile: '9876543210', email: 'rajesh@example.com',  kycStatus: 'VERIFIED', source: 'REFERRAL', stateName: 'Maharashtra', cityName: 'Mumbai' },
    { name: 'Sunita Desai',      mobile: '9123456789', email: 'sunita@example.com',  kycStatus: 'VERIFIED', source: 'WALK_IN',  stateName: 'Gujarat',     cityName: 'Ahmedabad' },
    { name: 'Aditya Kapoor',     mobile: '9988776655', email: 'aditya@example.com',  kycStatus: 'PENDING',  source: 'ONLINE',   stateName: 'Delhi',       cityName: 'New Delhi' },
    { name: 'Kavita Nair',       mobile: '9000111222', email: 'kavita@example.com',  kycStatus: 'VERIFIED', source: 'REFERRAL', stateName: 'Kerala',      cityName: 'Kochi' },
    { name: 'Mohan Pillai',      mobile: '9888777666', email: 'mohan@example.com',   kycStatus: 'VERIFIED', source: 'CAMPAIGN', stateName: 'Tamil Nadu',  cityName: 'Chennai' },
    { name: 'Sneha Reddy',       mobile: '9001122334', email: 'sneha@example.com',   kycStatus: 'PENDING',  source: 'ONLINE',   stateName: 'Telangana',   cityName: 'Hyderabad' },
    { name: 'Arjun Bhatt',       mobile: '9112233445', email: 'arjun@example.com',   kycStatus: 'VERIFIED', source: 'REFERRAL', stateName: 'Rajasthan',   cityName: 'Jaipur' },
    { name: 'Deepika Joshi',     mobile: '9223344556', email: 'deepika@example.com', kycStatus: 'VERIFIED', source: 'WALK_IN',  stateName: 'Uttar Pradesh', cityName: 'Lucknow' },
    { name: 'Karan Malhotra',    mobile: '9334455667', email: 'karan@example.com',   kycStatus: 'VERIFIED', source: 'CAMPAIGN', stateName: 'Punjab',      cityName: 'Chandigarh' },
    { name: 'Meera Saxena',      mobile: '9445566778', email: 'meera@example.com',   kycStatus: 'PENDING',  source: 'ONLINE',   stateName: 'Madhya Pradesh', cityName: 'Bhopal' },
  ];

  const customers: Array<{ id: string; name: string }> = [];
  for (const c of defs) {
    const existing = await prisma.customer.findFirst({ where: { mobile: c.mobile } });
    if (existing) {
      console.log(`  exists   ${c.name}`);
      customers.push({ id: existing.id, name: existing.name });
    } else {
      const created = await prisma.customer.create({ data: c, select: { id: true, name: true } });
      console.log(`  created  ${c.name}`);
      customers.push(created);
    }
  }
  return customers;
}

async function seedPosp(users: Array<{ id: string; email: string; role: string }>) {
  console.log('\n[3/4] POSP Roster…');

  const pospUser = users.find((u) => u.role === 'POSP');

  const defs = [
    { code: 'POSP-1001', name: 'Anjali Sharma', mobile: '9876543210', email: 'anjali.posp@example.com',  joined: new Date('2024-03-15'), active: true  },
    { code: 'POSP-1002', name: 'Rohit Kumar',   mobile: '9123456780', email: 'rohit.posp@example.com',   joined: new Date('2024-06-02'), active: true  },
    { code: 'POSP-1003', name: 'Priya Iyer',    mobile: '9988776600', email: 'priya.posp@example.com',   joined: new Date('2025-01-20'), active: true  },
    { code: 'POSP-1004', name: 'Vikram Singh',  mobile: '9000111200', email: 'vikram.posp@example.com',  joined: new Date('2023-11-10'), active: true  },
    { code: 'POSP-1005', name: 'Neha Patel',    mobile: '9888777600', email: 'neha.posp@example.com',    joined: new Date('2025-04-01'), active: false },
  ];

  const posps: Array<{ id: string; name: string }> = [];
  for (const p of defs) {
    const existing = await prisma.posp.findUnique({ where: { code: p.code } });
    if (existing) {
      console.log(`  exists   ${p.name} (${p.code})`);
      posps.push({ id: existing.id, name: existing.name });
    } else {
      const created = await prisma.posp.create({ data: p, select: { id: true, name: true } });
      console.log(`  created  ${p.name} (${p.code})`);
      posps.push(created);
    }
  }

  // Link the POSP user account to POSP-1001 if not already linked
  if (pospUser) {
    const p1 = posps[0];
    const user = await prisma.user.findUnique({ where: { id: pospUser.id } });
    if (user && !user.pospId) {
      await prisma.user.update({ where: { id: pospUser.id }, data: { pospId: p1.id } });
      console.log(`  linked   posp@roinet.com → ${p1.name}`);
    }
  }

  return posps;
}

async function seedDeals(posps: Array<{ id: string; name: string }>) {
  console.log('\n[4/4] Deals…');

  const dealCount = await prisma.deal.count();
  if (dealCount > 0) {
    console.log(`  skipped  — ${dealCount} deals already exist`);
    return;
  }

  const [p1, p2, p3, p4] = posps;

  const deals = [
    { pospId: p1.id, customerName: 'Rajesh Mehta',      policy: 'Life',          sum: 5000000,  premium: 45000, coa:  6000, margin:   3000, status: 'W', expected: new Date('2026-07-15'), proposal: 'PRP-22301', policyNo: '',            issued: null,                  remarks: 'Awaiting medical' },
    { pospId: p1.id, customerName: 'Sunita Desai',      policy: 'Health',        sum: 1000000,  premium: 18000, coa:  2400, margin:   1200, status: 'H', expected: new Date('2026-07-01'), proposal: 'PRP-22302', policyNo: '',            issued: null,                  remarks: 'Comparing 2 quotes' },
    { pospId: p2.id, customerName: 'Aditya Kapoor',     policy: 'Motor',         sum:  800000,  premium: 12500, coa:  1500, margin:    800, status: 'H', expected: new Date('2026-06-25'), proposal: 'PRP-22303', policyNo: '',            issued: null,                  remarks: 'Documents pending' },
    { pospId: p2.id, customerName: 'Kavita Nair',       policy: 'Health',        sum: 1500000,  premium: 22000, coa:  3000, margin:   1500, status: 'C', expected: new Date('2026-08-20'), proposal: 'PRP-22304', policyNo: '',            issued: null,                  remarks: 'Not responsive' },
    { pospId: p3.id, customerName: 'Mohan Pillai',      policy: 'Term',          sum: 10000000, premium: 28000, coa:  3500, margin:   1800, status: 'W', expected: new Date('2026-07-10'), proposal: 'PRP-22305', policyNo: '',            issued: null,                  remarks: 'Quote sent' },
    { pospId: p3.id, customerName: 'Sneha Reddy',       policy: 'Travel',        sum: 2000000,  premium:  4500, coa:   500, margin:    300, status: 'H', expected: new Date('2026-06-22'), proposal: 'PRP-22306', policyNo: 'POL-99812', issued: new Date('2026-06-15'), remarks: 'Issued' },
    { pospId: p4.id, customerName: 'Arjun Bhatt',       policy: 'Home',          sum: 8000000,  premium: 16000, coa:  2200, margin:   1100, status: 'W', expected: new Date('2026-07-30'), proposal: 'PRP-22307', policyNo: '',            issued: null,                  remarks: 'Property survey done' },
    { pospId: p4.id, customerName: 'Deepika Joshi',     policy: 'ULIP',          sum: 2500000,  premium: 60000, coa:  8000, margin:   4000, status: 'C', expected: new Date('2026-09-15'), proposal: 'PRP-22308', policyNo: '',            issued: null,                  remarks: 'Reviewing fund options' },
    { pospId: p1.id, customerName: 'Karan Malhotra',    policy: 'Life',          sum: 3000000,  premium: 32000, coa:  4500, margin:   2200, status: 'H', expected: new Date('2026-06-30'), proposal: 'PRP-22309', policyNo: 'POL-99813', issued: new Date('2026-06-18'), remarks: 'Issued, sending docs' },
    { pospId: p2.id, customerName: 'Meera Saxena',      policy: 'Health',        sum:  500000,  premium:  9500, coa:  1300, margin:    700, status: 'W', expected: new Date('2026-07-05'), proposal: 'PRP-22310', policyNo: '',            issued: null,                  remarks: 'KYC done' },
    { pospId: p3.id, customerName: 'Sanjay Verma',      policy: 'Motor',         sum:  600000,  premium:  8500, coa:  1100, margin:    550, status: 'H', expected: new Date('2026-06-24'), proposal: 'PRP-22311', policyNo: 'POL-99814', issued: new Date('2026-06-17'), remarks: 'Issued' },
    { pospId: p4.id, customerName: 'Ritu Agarwal',      policy: 'Term',          sum: 7500000,  premium: 18500, coa:  2500, margin:   1300, status: 'W', expected: new Date('2026-07-20'), proposal: 'PRP-22312', policyNo: '',            issued: null,                  remarks: 'Medical scheduled' },
    { pospId: p1.id, customerName: 'Naveen Khanna',     policy: 'Travel',        sum: 1500000,  premium:  3800, coa:   500, margin:    280, status: 'H', expected: new Date('2026-06-26'), proposal: 'PRP-22313', policyNo: 'POL-99815', issued: new Date('2026-06-19'), remarks: 'Europe trip, issued' },
    { pospId: p2.id, customerName: 'Pooja Saxena',      policy: 'Travel',        sum: 1000000,  premium:  2200, coa:   300, margin:    180, status: 'W', expected: new Date('2026-07-08'), proposal: 'PRP-22314', policyNo: '',            issued: null,                  remarks: 'Family Asia trip' },
    { pospId: p3.id, customerName: 'Harish Goel',       policy: 'Travel',        sum:  800000,  premium:  1900, coa:   250, margin:    150, status: 'C', expected: new Date('2026-08-12'), proposal: 'PRP-22315', policyNo: '',            issued: null,                  remarks: 'Solo trip, still deciding' },
    { pospId: p1.id, customerName: 'Sameer Bhatia',     policy: 'Personal Loan', sum:  800000,  premium:     0, coa:  8000, margin:  12000, status: 'H', expected: new Date('2026-06-28'), proposal: 'PRP-22316', policyNo: 'LOAN-44012',issued: new Date('2026-06-15'), remarks: 'Disbursed, 14% APR' },
    { pospId: p2.id, customerName: 'Geeta Mishra',      policy: 'Personal Loan', sum:  500000,  premium:     0, coa:  5000, margin:   7500, status: 'W', expected: new Date('2026-07-02'), proposal: 'PRP-22317', policyNo: '',            issued: null,                  remarks: 'KYC done, bank verifying' },
    { pospId: p4.id, customerName: 'Ashok Pandey',      policy: 'Home Loan',     sum: 5000000,  premium:     0, coa: 50000, margin:  75000, status: 'H', expected: new Date('2026-07-15'), proposal: 'PRP-22318', policyNo: '',            issued: null,                  remarks: 'Property docs pending' },
    { pospId: p3.id, customerName: 'Lakshmi Rao',       policy: 'Home Loan',     sum: 7500000,  premium:     0, coa: 75000, margin: 110000, status: 'W', expected: new Date('2026-08-10'), proposal: 'PRP-22319', policyNo: '',            issued: null,                  remarks: 'Bank shortlist made' },
    { pospId: p4.id, customerName: 'Bharat Industries', policy: 'Business Loan', sum: 2500000,  premium:     0, coa: 25000, margin:  40000, status: 'C', expected: new Date('2026-09-20'), proposal: 'PRP-22320', policyNo: '',            issued: null,                  remarks: 'Awaiting CA financials' },
  ];

  await prisma.deal.createMany({ data: deals });
  console.log(`  created  ${deals.length} deals`);
}

// ─── main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' Roinet CRM — Database Seed');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const users = await seedUsers();
  await seedCustomers();
  const posps = await seedPosp(users);
  await seedDeals(posps);

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
