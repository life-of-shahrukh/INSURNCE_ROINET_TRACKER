/** Target counts for pagination testing (default page sizes 10/25/50). */
export const SEED_TARGETS = {
  customers: 60,
  posp: 24,
  deals: 120,
  leads: 60,
} as const;

const FIRST_NAMES = [
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
  'Green',
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
];

const LAST_NAMES = [
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
  'Industries',
  'Gupta',
  'Shah',
  'Menon',
  'Chopra',
  'Das',
  'Banerjee',
  'Kulkarni',
  'Naik',
];

const STATES = [
  { stateName: 'Maharashtra', cityName: 'Mumbai' },
  { stateName: 'Gujarat', cityName: 'Ahmedabad' },
  { stateName: 'Delhi', cityName: 'New Delhi' },
  { stateName: 'Kerala', cityName: 'Kochi' },
  { stateName: 'Tamil Nadu', cityName: 'Chennai' },
  { stateName: 'Telangana', cityName: 'Hyderabad' },
  { stateName: 'Rajasthan', cityName: 'Jaipur' },
  { stateName: 'Uttar Pradesh', cityName: 'Lucknow' },
  { stateName: 'Punjab', cityName: 'Chandigarh' },
  { stateName: 'Karnataka', cityName: 'Bengaluru' },
];

const KYC_STATUSES = [
  'VERIFIED',
  'VERIFIED',
  'VERIFIED',
  'PENDING',
  'PENDING',
  'REJECTED',
] as const;
const SOURCES = ['REFERRAL', 'WALK_IN', 'ONLINE', 'CAMPAIGN'] as const;

const POLICIES = [
  'Life',
  'Health',
  'Motor',
  'Term',
  'Travel',
  'Home',
  'ULIP',
  'Personal Loan',
  'Home Loan',
  'Business Loan',
] as const;

const DEAL_STATUSES = ['H', 'W', 'C'] as const;

const LEAD_PRODUCTS = [
  'HEALTH',
  'MOTOR',
  'LIFE',
  'TRAVEL',
  'COMMERCIAL_LINES',
  'RURAL',
  'HOME',
] as const;

const LEAD_TIMELINES = ['THIS_MONTH', 'T_PLUS_1', 'T_PLUS_2', 'LATER'] as const;
const LEAD_STATUSES = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'PROPOSAL_SENT',
  'WON',
  'LOST',
] as const;

function personName(index: number): string {
  const first = FIRST_NAMES[index % FIRST_NAMES.length];
  const last = LAST_NAMES[(index * 3 + 7) % LAST_NAMES.length];
  return `${first} ${last}`;
}

function mobileFor(index: number, prefix = '98'): string {
  return `${prefix}${String(10000000 + index)
    .padStart(8, '0')
    .slice(-8)}`;
}

export function buildCustomerSeed(index: number) {
  const name = personName(index);
  const loc = STATES[index % STATES.length];
  const slug = name.toLowerCase().replace(/\s+/g, '.');
  return {
    name,
    mobile: mobileFor(index, '98'),
    email: `${slug}.${index}@example.com`,
    kycStatus: KYC_STATUSES[index % KYC_STATUSES.length],
    source: SOURCES[index % SOURCES.length],
    stateName: loc.stateName,
    cityName: loc.cityName,
  };
}

export function buildPospSeed(index: number) {
  const name = personName(index + 40);
  const code = `POSP-${1001 + index}`;
  return {
    code,
    name,
    mobile: mobileFor(index, '97'),
    email: `posp.${code.toLowerCase()}@example.com`,
    joined: new Date(2023 + (index % 3), index % 12, 1 + (index % 28)),
    active: index % 5 !== 0,
  };
}

export function buildDealSeed(
  index: number,
  pospId: string,
  customerName: string,
) {
  const policy = POLICIES[index % POLICIES.length];
  const isLoan = policy.includes('Loan');
  const premium = isLoan ? 0 : 5000 + (index % 20) * 2500;
  const sum = isLoan
    ? 500000 + (index % 15) * 500000
    : 500000 + (index % 25) * 400000;
  const coa = Math.round(premium * 0.12 + sum * 0.001);
  const margin = Math.round(premium * 0.06 + (isLoan ? sum * 0.01 : 0));
  const status = DEAL_STATUSES[index % DEAL_STATUSES.length];
  const issued =
    index % 4 === 0 ? new Date(2025, index % 12, 1 + (index % 28)) : null;
  const month = index % 12;
  const day = 1 + (index % 28);

  return {
    pospId,
    customerName,
    policy,
    sum,
    premium,
    coa,
    margin,
    status,
    expected: new Date(2026, month, day),
    proposal: `PRP-${22400 + index}`,
    policyNo: issued ? `POL-${99000 + index}` : '',
    issued,
    remarks: `Seed deal #${index + 1} — ${status === 'H' ? 'Hot prospect' : status === 'W' ? 'Warm follow-up' : 'Cold lead'}`,
  };
}

export function buildLeadSeed(
  index: number,
  customerId: string,
  assignedToId: string | null,
) {
  const month = index % 12;
  const day = 5 + (index % 24);

  return {
    customerId,
    assignedToId,
    product: LEAD_PRODUCTS[index % LEAD_PRODUCTS.length],
    productSubType: index % 2 === 0 ? 'Individual' : 'Family Floater',
    estimatedPremium: 8000 + (index % 30) * 1500,
    estimatedSum: 500000 + (index % 20) * 250000,
    closureTimeline: LEAD_TIMELINES[index % LEAD_TIMELINES.length],
    expectedCloseDate: new Date(2026, month, day),
    status: LEAD_STATUSES[index % LEAD_STATUSES.length],
    source: SOURCES[index % SOURCES.length],
    remarks: `Seed lead #${index + 1}`,
  };
}

export const SALES_TEAM_DEFS = [
  {
    email: 'national@roinet.com',
    name: 'Ravi National',
    employeeCode: 'EMP-N001',
    designation: 'NATIONAL_HEAD',
    territory: 'India',
    mobile: '9100000001',
  },
  {
    email: 'zonal@roinet.com',
    name: 'Zonal Head West',
    employeeCode: 'EMP-Z001',
    designation: 'ZH',
    territory: 'West Zone',
    mobile: '9100000002',
  },
  {
    email: 'regional@roinet.com',
    name: 'Regional Head MH',
    employeeCode: 'EMP-R001',
    designation: 'RH',
    territory: 'Maharashtra',
    mobile: '9100000003',
  },
  {
    email: 'asm@roinet.com',
    name: 'Area Sales Manager',
    employeeCode: 'EMP-A001',
    designation: 'ASM',
    territory: 'Mumbai Metro',
    mobile: '9100000004',
  },
  {
    email: 'dm@roinet.com',
    name: 'District Manager',
    employeeCode: 'EMP-D001',
    designation: 'DM',
    territory: 'Mumbai South',
    mobile: '9100000005',
  },
] as const;
