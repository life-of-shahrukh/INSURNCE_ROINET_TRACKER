/** Target counts for pagination testing (default page sizes 10/25/50). */
export const SEED_TARGETS = {
  customers: 60,
  posp: 24,
  deals: 120,
  leads: 60,
} as const;

/**
 * Real Cognitensor zone IDs (from ListZone snapshot).
 * These are used as the zoneId on SalesTeam and Posp records.
 */
export const REAL_ZONES = {
  NORTH_INDIA: '1',   // J&K/PB/HP/HAR/DELHI/NCR
  UP_UTT: '2',        // UP/UTT
  RAJ_GUJ: '3',       // RAJ/GUJ/MP/UT1
  MAH_GOA: '4',       // MAH/GOA
  WB_NE: '5',         // WB/NE/CDG
  BIHAR_JH: '6',      // Bihar/JHND
  SOUTH: '7',         // TN/KE/KAR/UT2
  ODISHA: '8',        // odisha
  AP_TEL: '9',        // AP/TEL
} as const;

/**
 * A curated set of real Cognitensor district IDs per zone,
 * derived from the ListHierarchyUserData snapshot. Used to seed
 * DistrictHierarchy and POSP districtId fields.
 */
export const REAL_DISTRICT_IDS_BY_ZONE: Record<string, string[]> = {
  '9':  ['1', '2', '3', '4', '5', '6', '7', '8'],    // AP/TEL
  '7':  ['25', '26', '28', '30', '31', '34', '36'],   // TN/KE/KAR
  '1':  ['387', '388', '389', '390', '391', '392'],   // J&K/PB/HP/HAR/DELHI/NCR
  '2':  ['481', '482', '483', '484', '485'],           // UP/UTT
  '6':  ['87', '88', '89', '90', '91', '92'],          // Bihar/JHND
  '4':  ['200', '201', '202', '203'],                  // MAH/GOA
  '3':  ['300', '301', '302'],                         // RAJ/GUJ
  '5':  ['350', '351'],                                // WB/NE/CDG
  '8':  ['400', '401'],                                // Odisha
};

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
  'LIFE',
  'HEALTH',
  'MOTOR',
  'PROPERTY',
  'MARINE',
  'TRAVEL',
  'COMMERCIAL',
  'CROP',
  'ENGINEERING',
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

export function buildPospSeed(index: number, districtId?: string) {
  const name = personName(index + 40);
  const code = `POSP-${1001 + index}`;
  return {
    code,
    name,
    mobile: mobileFor(index, '97'),
    email: `posp.${code.toLowerCase()}@example.com`,
    joined: new Date(2023 + (index % 3), index % 12, 1 + (index % 28)),
    active: index % 5 !== 0,
    districtId: districtId ?? null,
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
    // Real Cognitensor ZH code from ListHierarchyUserData snapshot
    employeeCode: 'RAVI.BABUSZH',
    designation: 'ZH',
    territory: 'West Zone',
    mobile: '9100000002',
  },
  {
    email: 'regional@roinet.com',
    name: 'Regional Head MH',
    // Real Cognitensor RH code
    employeeCode: 'NURULLA.ASMAP',
    designation: 'RH',
    territory: 'Maharashtra',
    mobile: '9100000003',
  },
  {
    email: 'asm@roinet.com',
    name: 'Area Sales Manager',
    // Real Cognitensor ASM code
    employeeCode: 'BELLAMKONDA.ASMAP',
    designation: 'ASM',
    territory: 'Mumbai Metro',
    mobile: '9100000004',
  },
  {
    email: 'dm@roinet.com',
    name: 'District Manager',
    // Real Cognitensor DM/CH code
    employeeCode: 'RAKESH.GADDAM CH TEL',
    designation: 'DM',
    territory: 'Mumbai South',
    mobile: '9100000005',
  },
] as const;

/**
 * Curated subset of real district hierarchy rows from the Cognitensor
 * ListHierarchyUserData snapshot. Used to seed the DistrictHierarchy table
 * so that manager SSO logins can resolve territory without a live API call.
 *
 * Structure mirrors exactly what `syncManagerDistrictHierarchy()` stores.
 */
export const DISTRICT_HIERARCHY_SEED: Array<{
  districtId: string;
  districtName: string;
  stateId?: string;
  dmCode?: string;
  dmName?: string;
  asmCode?: string;
  asmName?: string;
  rhCode?: string;
  rhName?: string;
  zhCode?: string;
  zhName?: string;
}> = [
  // ── AP / TEL (zoneId: 9) ─────────────────────────────────────────────────
  { districtId: '1',  districtName: 'ADILABAD',     stateId: '12', dmCode: 'RAKESH.GADDAM CH TEL', dmName: 'Rakesh Gaddam',                    rhCode: 'PRAVEEN.RHTEL',  rhName: 'PRAVEEN PILLI RH TEL', zhCode: 'RAVI.BABUSZH', zhName: 'Ravi Babu Ummadisetty' },
  { districtId: '2',  districtName: 'ANANTAPUR',    stateId: '12', dmCode: 'BELLAMKONDA.ASMAP',    dmName: 'BELLAMKONDA MEERA BABU ASM AP',    rhCode: 'NURULLA.ASMAP',  rhName: 'NURULLA SYED ASM AP',  zhCode: 'RAVI.BABUSZH', zhName: 'Ravi Babu Ummadisetty' },
  { districtId: '3',  districtName: 'CHITTOOR',     stateId: '12', dmCode: 'BELLAMKONDA.ASMAP',    dmName: 'BELLAMKONDA MEERA BABU ASM AP',    rhCode: 'NURULLA.ASMAP',  rhName: 'NURULLA SYED ASM AP',  zhCode: 'RAVI.BABUSZH', zhName: 'Ravi Babu Ummadisetty' },
  { districtId: '4',  districtName: 'EAST GODAWARI',stateId: '12', dmCode: 'YERRAMSETTI.ASMAP',    dmName: 'YERRAMSETTI SANTOSH KUMAR ASM AP', rhCode: 'NURULLA.ASMAP',  rhName: 'NURULLA SYED ASM AP',  zhCode: 'RAVI.BABUSZH', zhName: 'Ravi Babu Ummadisetty' },
  { districtId: '5',  districtName: 'GUNTUR',       stateId: '12', dmCode: 'PADALA.ASMAP',         dmName: 'PADALA ASM AP',                    rhCode: 'NURULLA.ASMAP',  rhName: 'NURULLA SYED ASM AP',  zhCode: 'RAVI.BABUSZH', zhName: 'Ravi Babu Ummadisetty' },
  { districtId: '6',  districtName: 'KADAPA',       stateId: '12', dmCode: 'BELLAMKONDA.ASMAP',    dmName: 'BELLAMKONDA MEERA BABU ASM AP',    rhCode: 'NURULLA.ASMAP',  rhName: 'NURULLA SYED ASM AP',  zhCode: 'RAVI.BABUSZH', zhName: 'Ravi Babu Ummadisetty' },
  { districtId: '7',  districtName: 'KRISHNA',      stateId: '12', dmCode: 'YERRAMSETTI.ASMAP',    dmName: 'YERRAMSETTI SANTOSH KUMAR ASM AP', rhCode: 'NURULLA.ASMAP',  rhName: 'NURULLA SYED ASM AP',  zhCode: 'RAVI.BABUSZH', zhName: 'Ravi Babu Ummadisetty' },
  { districtId: '8',  districtName: 'KARIMNAGAR',   stateId: '12', dmCode: 'RAKESH.GADDAM CH TEL', dmName: 'Rakesh Gaddam',                    rhCode: 'PRAVEEN.RHTEL',  rhName: 'PRAVEEN PILLI RH TEL', zhCode: 'RAVI.BABUSZH', zhName: 'Ravi Babu Ummadisetty' },
  // ── TN/KE/KAR (zoneId: 7) ────────────────────────────────────────────────
  { districtId: '25', districtName: 'CHENNAI',      stateId: '33', dmCode: 'RAJ.ASMTN',            dmName: 'RAJ KUMAR ASM TN DIRECT',          rhCode: 'BHOOPATHI.RHTN', rhName: 'BOOPATHI MANOKARAN',   zhCode: 'RAVI.BABUSZH', zhName: 'Ravi Babu Ummadisetty' },
  { districtId: '26', districtName: 'COIMBATORE',   stateId: '33', dmCode: 'MOHAN.ASMTN',          dmName: 'MOHAN RAM KUMAR ASM TN',           rhCode: 'BHOOPATHI.RHTN', rhName: 'BOOPATHI MANOKARAN',   zhCode: 'RAVI.BABUSZH', zhName: 'Ravi Babu Ummadisetty' },
  { districtId: '28', districtName: 'DHARMAPURI',   stateId: '33', dmCode: 'GANESAN.ASMTN',        dmName: 'GANESAN MADHAPPA ASM TN',          rhCode: 'BHOOPATHI.RHTN', rhName: 'BOOPATHI MANOKARAN',   zhCode: 'RAVI.BABUSZH', zhName: 'Ravi Babu Ummadisetty' },
  { districtId: '30', districtName: 'ERODE',        stateId: '33', dmCode: 'GANESAN.ASMTN',        dmName: 'GANESAN MADHAPPA ASM TN',          rhCode: 'BHOOPATHI.RHTN', rhName: 'BOOPATHI MANOKARAN',   zhCode: 'RAVI.BABUSZH', zhName: 'Ravi Babu Ummadisetty' },
  { districtId: '31', districtName: 'KANCHIPURAM',  stateId: '33', dmCode: 'RAJ.ASMTN',            dmName: 'RAJ KUMAR ASM TN DIRECT',          rhCode: 'BHOOPATHI.RHTN', rhName: 'BOOPATHI MANOKARAN',   zhCode: 'RAVI.BABUSZH', zhName: 'Ravi Babu Ummadisetty' },
  // ── HAR/NCR (zoneId: 1) ───────────────────────────────────────────────────
  { districtId: '387', districtName: 'AMBALA',      stateId: '2',  dmCode: 'PALLAV.KUMAR ZH NCR',  dmName: 'Pallav Kumar',                     zhCode: 'PALLAV.KUMAR ZH NCR', zhName: 'Pallav Kumar' },
  { districtId: '388', districtName: 'BHIWANI',     stateId: '2',  dmCode: 'PALLAV.KUMAR ZH NCR',  dmName: 'Pallav Kumar',                     zhCode: 'PALLAV.KUMAR ZH NCR', zhName: 'Pallav Kumar' },
  { districtId: '389', districtName: 'FARIDABAD',   stateId: '2',  dmCode: 'PALLAV.KUMAR ZH NCR',  dmName: 'Pallav Kumar',                     zhCode: 'PALLAV.KUMAR ZH NCR', zhName: 'Pallav Kumar' },
  { districtId: '391', districtName: 'GURGAON',     stateId: '2',  dmCode: 'PALLAV.KUMAR ZH NCR',  dmName: 'Pallav Kumar',                     zhCode: 'PALLAV.KUMAR ZH NCR', zhName: 'Pallav Kumar' },
  // ── Bihar/JHND (zoneId: 6) ────────────────────────────────────────────────
  { districtId: '87',  districtName: 'KATIHAR',     stateId: '12', dmCode: 'RAMANUJ.BIHARJHKZM',   dmName: 'RAMANUJ BIHAR JHARKHAND',          zhCode: 'RAMANUJ.BIHARJHKZM', zhName: 'RAMANUJ BIHAR JHARKHAND' },
  { districtId: '88',  districtName: 'LAKHISARAI',  stateId: '12', dmCode: 'RAMANUJ.BIHARJHKZM',   dmName: 'RAMANUJ BIHAR JHARKHAND',          zhCode: 'RAMANUJ.BIHARJHKZM', zhName: 'RAMANUJ BIHAR JHARKHAND' },
  { districtId: '89',  districtName: 'MADHUBANI',   stateId: '12', dmCode: 'RAMANUJ.BIHARJHKZM',   dmName: 'RAMANUJ BIHAR JHARKHAND',          zhCode: 'RAMANUJ.BIHARJHKZM', zhName: 'RAMANUJ BIHAR JHARKHAND' },
  { districtId: '92',  districtName: 'MUZAFFARPUR', stateId: '12', dmCode: 'RAMANUJ.BIHARJHKZM',   dmName: 'RAMANUJ BIHAR JHARKHAND',          zhCode: 'RAMANUJ.BIHARJHKZM', zhName: 'RAMANUJ BIHAR JHARKHAND' },
  { districtId: '95',  districtName: 'PATNA',       stateId: '12', dmCode: 'RAMANUJ.BIHARJHKZM',   dmName: 'RAMANUJ BIHAR JHARKHAND',          zhCode: 'RAMANUJ.BIHARJHKZM', zhName: 'RAMANUJ BIHAR JHARKHAND' },
];
