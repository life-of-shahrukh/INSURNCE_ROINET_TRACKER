import type { CrmState, Deal, Posp } from "./types";

const SEED_TARGETS = {
  posp: 24,
  deals: 120,
} as const;

const FIRST_NAMES = [
  "Rajesh", "Sunita", "Aditya", "Kavita", "Mohan", "Sneha", "Arjun", "Deepika",
  "Karan", "Meera", "Sanjay", "Ritu", "Naveen", "Pooja", "Harish", "Geeta",
  "Ashok", "Lakshmi", "Vikram", "Anjali", "Rohit", "Priya", "Neha", "Sameer",
];

const LAST_NAMES = [
  "Mehta", "Desai", "Kapoor", "Nair", "Pillai", "Reddy", "Bhatt", "Joshi",
  "Malhotra", "Saxena", "Verma", "Agarwal", "Khanna", "Goel", "Mishra", "Pandey",
  "Rao", "Sharma", "Kumar", "Iyer", "Singh", "Patel", "Bhatia", "Gupta",
];

const POLICIES = [
  "Life", "Health", "Motor", "Term", "Travel", "Home", "ULIP",
  "Personal Loan", "Home Loan", "Business Loan",
] as const;

const DEAL_STATUSES = ["H", "W", "C"] as const;

function personName(index: number): string {
  const first = FIRST_NAMES[index % FIRST_NAMES.length];
  const last = LAST_NAMES[(index * 3 + 7) % LAST_NAMES.length];
  return `${first} ${last}`;
}

function buildPosp(index: number): Posp {
  const name = personName(index + 20);
  const code = `POSP-${1001 + index}`;
  const now = new Date();
  return {
    id: `p${index + 1}`,
    name,
    code,
    mobile: `97${String(10000000 + index).padStart(8, "0").slice(-8)}`,
    email: `posp.${code.toLowerCase()}@example.com`,
    joined: new Date(2023 + (index % 3), index % 12, 1 + (index % 28)),
    active: index % 5 !== 0,
    createdAt: now,
    updatedAt: now,
  };
}

function buildDeal(index: number, pospId: string): Deal {
  const policy = POLICIES[index % POLICIES.length];
  const isLoan = policy.includes("Loan");
  const premium = isLoan ? 0 : 5000 + (index % 20) * 2500;
  const sum = isLoan
    ? 500000 + (index % 15) * 500000
    : 500000 + (index % 25) * 400000;
  const coa = Math.round(premium * 0.12 + sum * 0.001);
  const margin = Math.round(premium * 0.06 + (isLoan ? sum * 0.01 : 0));
  const status = DEAL_STATUSES[index % DEAL_STATUSES.length];
  const issued = index % 4 === 0 ? new Date(2025, index % 12, 1 + (index % 28)) : undefined;
  const now = new Date();

  return {
    id: `d${index + 1}`,
    pospId,
    customerId: null,
    customer: personName(index),
    policy,
    sum,
    premium,
    coa,
    coaType: "AMOUNT" as const,
    coaAmount: coa,
    margin,
    status,
    expected: new Date(2026, index % 12, 1 + (index % 28)),
    proposal: `PRP-${22400 + index}`,
    policyNo: issued ? `POL-${99000 + index}` : "",
    issued,
    remarks: `Mock deal #${index + 1}`,
    createdAt: now,
    updatedAt: now,
  };
}

function buildSeed(): CrmState {
  const posp = Array.from({ length: SEED_TARGETS.posp }, (_, i) => buildPosp(i));
  const deals = Array.from({ length: SEED_TARGETS.deals }, (_, i) =>
    buildDeal(i, posp[i % posp.length].id),
  );
  return { posp, deals };
}

export const SEED: CrmState = buildSeed();

export const SEED_COUNTS = SEED_TARGETS;
