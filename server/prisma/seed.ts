import 'dotenv/config';
import { PrismaClient, DealStatus, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  await prisma.deal.deleteMany();
  await prisma.posp.deleteMany();

  const [p1, p2, p3, p4, p5] = await Promise.all([
    prisma.posp.create({
      data: { name: 'Anjali Sharma', code: 'POSP-1001', mobile: '9876543210', email: 'anjali@example.com', joined: new Date('2024-03-15'), active: true },
    }),
    prisma.posp.create({
      data: { name: 'Rohit Kumar', code: 'POSP-1002', mobile: '9123456780', email: 'rohit@example.com', joined: new Date('2024-06-02'), active: true },
    }),
    prisma.posp.create({
      data: { name: 'Priya Iyer', code: 'POSP-1003', mobile: '9988776655', email: 'priya@example.com', joined: new Date('2025-01-20'), active: true },
    }),
    prisma.posp.create({
      data: { name: 'Vikram Singh', code: 'POSP-1004', mobile: '9000111222', email: 'vikram@example.com', joined: new Date('2023-11-10'), active: true },
    }),
    prisma.posp.create({
      data: { name: 'Neha Patel', code: 'POSP-1005', mobile: '9888777666', email: 'neha@example.com', joined: new Date('2025-04-01'), active: false },
    }),
  ]);

  console.log(`Created 5 POSPs. p5 (${p5.name}) is inactive.`);

  const deals: Prisma.DealCreateManyInput[] = [
    { pospId: p1.id, customer: 'Rajesh Mehta', policy: 'Life', sum: 5000000, premium: 45000, coa: 6000, margin: 3000, status: DealStatus.W, expected: new Date('2026-06-15'), proposal: 'PRP-22301', policyNo: '', issued: null, remarks: 'Awaiting medical' },
    { pospId: p1.id, customer: 'Sunita Desai', policy: 'Health', sum: 1000000, premium: 18000, coa: 2400, margin: 1200, status: DealStatus.H, expected: new Date('2026-05-28'), proposal: 'PRP-22302', policyNo: '', issued: null, remarks: 'Comparing 2 quotes' },
    { pospId: p2.id, customer: 'Aditya Kapoor', policy: 'Motor', sum: 800000, premium: 12500, coa: 1500, margin: 800, status: DealStatus.H, expected: new Date('2026-05-25'), proposal: 'PRP-22303', policyNo: '', issued: null, remarks: 'Documents pending' },
    { pospId: p2.id, customer: 'Kavita Nair', policy: 'Health', sum: 1500000, premium: 22000, coa: 3000, margin: 1500, status: DealStatus.C, expected: new Date('2026-07-20'), proposal: 'PRP-22304', policyNo: '', issued: null, remarks: 'Not responsive' },
    { pospId: p3.id, customer: 'Mohan Pillai', policy: 'Term', sum: 10000000, premium: 28000, coa: 3500, margin: 1800, status: DealStatus.W, expected: new Date('2026-06-10'), proposal: 'PRP-22305', policyNo: '', issued: null, remarks: 'Quote sent' },
    { pospId: p3.id, customer: 'Sneha Reddy', policy: 'Travel', sum: 2000000, premium: 4500, coa: 500, margin: 300, status: DealStatus.H, expected: new Date('2026-05-22'), proposal: 'PRP-22306', policyNo: 'POL-99812', issued: new Date('2026-05-15'), remarks: 'Issued' },
    { pospId: p4.id, customer: 'Arjun Bhatt', policy: 'Home', sum: 8000000, premium: 16000, coa: 2200, margin: 1100, status: DealStatus.W, expected: new Date('2026-06-30'), proposal: 'PRP-22307', policyNo: '', issued: null, remarks: 'Property survey done' },
    { pospId: p4.id, customer: 'Deepika Joshi', policy: 'ULIP', sum: 2500000, premium: 60000, coa: 8000, margin: 4000, status: DealStatus.C, expected: new Date('2026-08-15'), proposal: 'PRP-22308', policyNo: '', issued: null, remarks: 'Reviewing fund options' },
    { pospId: p1.id, customer: 'Karan Malhotra', policy: 'Life', sum: 3000000, premium: 32000, coa: 4500, margin: 2200, status: DealStatus.H, expected: new Date('2026-05-30'), proposal: 'PRP-22309', policyNo: 'POL-99813', issued: new Date('2026-05-18'), remarks: 'Issued, sending docs' },
    { pospId: p2.id, customer: 'Meera Saxena', policy: 'Health', sum: 500000, premium: 9500, coa: 1300, margin: 700, status: DealStatus.W, expected: new Date('2026-06-05'), proposal: 'PRP-22310', policyNo: '', issued: null, remarks: 'KYC done' },
    { pospId: p3.id, customer: 'Sanjay Verma', policy: 'Motor', sum: 600000, premium: 8500, coa: 1100, margin: 550, status: DealStatus.H, expected: new Date('2026-05-24'), proposal: 'PRP-22311', policyNo: 'POL-99814', issued: new Date('2026-05-17'), remarks: 'Issued' },
    { pospId: p4.id, customer: 'Ritu Agarwal', policy: 'Term', sum: 7500000, premium: 18500, coa: 2500, margin: 1300, status: DealStatus.W, expected: new Date('2026-06-20'), proposal: 'PRP-22312', policyNo: '', issued: null, remarks: 'Medical scheduled' },
    { pospId: p1.id, customer: 'Naveen Khanna', policy: 'Travel', sum: 1500000, premium: 3800, coa: 500, margin: 280, status: DealStatus.H, expected: new Date('2026-05-26'), proposal: 'PRP-22313', policyNo: 'POL-99815', issued: new Date('2026-05-19'), remarks: 'Europe trip, issued' },
    { pospId: p2.id, customer: 'Pooja Saxena', policy: 'Travel', sum: 1000000, premium: 2200, coa: 300, margin: 180, status: DealStatus.W, expected: new Date('2026-06-08'), proposal: 'PRP-22314', policyNo: '', issued: null, remarks: 'Family Asia trip' },
    { pospId: p3.id, customer: 'Harish Goel', policy: 'Travel', sum: 800000, premium: 1900, coa: 250, margin: 150, status: DealStatus.C, expected: new Date('2026-07-12'), proposal: 'PRP-22315', policyNo: '', issued: null, remarks: 'Solo trip, still deciding' },
    { pospId: p1.id, customer: 'Sameer Bhatia', policy: 'Personal Loan', sum: 800000, premium: 0, coa: 8000, margin: 12000, status: DealStatus.H, expected: new Date('2026-05-28'), proposal: 'PRP-22316', policyNo: 'LOAN-44012', issued: new Date('2026-05-15'), remarks: 'Disbursed, 14% APR' },
    { pospId: p2.id, customer: 'Geeta Mishra', policy: 'Personal Loan', sum: 500000, premium: 0, coa: 5000, margin: 7500, status: DealStatus.W, expected: new Date('2026-06-02'), proposal: 'PRP-22317', policyNo: '', issued: null, remarks: 'KYC done, bank verifying' },
    { pospId: p4.id, customer: 'Ashok Pandey', policy: 'Home Loan', sum: 5000000, premium: 0, coa: 50000, margin: 75000, status: DealStatus.H, expected: new Date('2026-06-15'), proposal: 'PRP-22318', policyNo: '', issued: null, remarks: 'Property docs pending' },
    { pospId: p3.id, customer: 'Lakshmi Rao', policy: 'Home Loan', sum: 7500000, premium: 0, coa: 75000, margin: 110000, status: DealStatus.W, expected: new Date('2026-07-10'), proposal: 'PRP-22319', policyNo: '', issued: null, remarks: 'Bank shortlist made' },
    { pospId: p4.id, customer: 'Bharat Industries', policy: 'Business Loan', sum: 2500000, premium: 0, coa: 25000, margin: 40000, status: DealStatus.C, expected: new Date('2026-08-20'), proposal: 'PRP-22320', policyNo: '', issued: null, remarks: 'Awaiting CA financials' },
    { pospId: p2.id, customer: 'GreenTech LLP', policy: 'Business Loan', sum: 1200000, premium: 0, coa: 12000, margin: 18000, status: DealStatus.H, expected: new Date('2026-05-30'), proposal: 'PRP-22321', policyNo: 'LOAN-44013', issued: new Date('2026-05-12'), remarks: 'Disbursed' },
  ];

  await prisma.deal.createMany({ data: deals });
  console.log(`Created ${deals.length} deals.`);
  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
