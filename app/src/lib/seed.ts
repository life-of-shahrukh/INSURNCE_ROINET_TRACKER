import type { CrmState } from "./types";

export const SEED: CrmState = {
  posp: [
    { id: "p1", name: "Anjali Sharma", code: "POSP-1001", mobile: "9876543210", email: "anjali@example.com", joined: "2024-03-15", active: true },
    { id: "p2", name: "Rohit Kumar", code: "POSP-1002", mobile: "9123456780", email: "rohit@example.com", joined: "2024-06-02", active: true },
    { id: "p3", name: "Priya Iyer", code: "POSP-1003", mobile: "9988776655", email: "priya@example.com", joined: "2025-01-20", active: true },
    { id: "p4", name: "Vikram Singh", code: "POSP-1004", mobile: "9000111222", email: "vikram@example.com", joined: "2023-11-10", active: true },
    { id: "p5", name: "Neha Patel", code: "POSP-1005", mobile: "9888777666", email: "neha@example.com", joined: "2025-04-01", active: false },
  ],
  deals: [
    { id: "d1", pospId: "p1", customer: "Rajesh Mehta", policy: "Life", sum: 5000000, premium: 45000, coa: 6000, margin: 3000, status: "W", expected: "2026-06-15", proposal: "PRP-22301", policyNo: "", issued: "", remarks: "Awaiting medical" },
    { id: "d2", pospId: "p1", customer: "Sunita Desai", policy: "Health", sum: 1000000, premium: 18000, coa: 2400, margin: 1200, status: "H", expected: "2026-05-28", proposal: "PRP-22302", policyNo: "", issued: "", remarks: "Comparing 2 quotes" },
    { id: "d3", pospId: "p2", customer: "Aditya Kapoor", policy: "Motor", sum: 800000, premium: 12500, coa: 1500, margin: 800, status: "H", expected: "2026-05-25", proposal: "PRP-22303", policyNo: "", issued: "", remarks: "Documents pending" },
    { id: "d4", pospId: "p2", customer: "Kavita Nair", policy: "Health", sum: 1500000, premium: 22000, coa: 3000, margin: 1500, status: "C", expected: "2026-07-20", proposal: "PRP-22304", policyNo: "", issued: "", remarks: "Not responsive" },
    { id: "d5", pospId: "p3", customer: "Mohan Pillai", policy: "Term", sum: 10000000, premium: 28000, coa: 3500, margin: 1800, status: "W", expected: "2026-06-10", proposal: "PRP-22305", policyNo: "", issued: "", remarks: "Quote sent" },
    { id: "d6", pospId: "p3", customer: "Sneha Reddy", policy: "Travel", sum: 2000000, premium: 4500, coa: 500, margin: 300, status: "H", expected: "2026-05-22", proposal: "PRP-22306", policyNo: "POL-99812", issued: "2026-05-15", remarks: "Issued" },
    { id: "d7", pospId: "p4", customer: "Arjun Bhatt", policy: "Home", sum: 8000000, premium: 16000, coa: 2200, margin: 1100, status: "W", expected: "2026-06-30", proposal: "PRP-22307", policyNo: "", issued: "", remarks: "Property survey done" },
    { id: "d8", pospId: "p4", customer: "Deepika Joshi", policy: "ULIP", sum: 2500000, premium: 60000, coa: 8000, margin: 4000, status: "C", expected: "2026-08-15", proposal: "PRP-22308", policyNo: "", issued: "", remarks: "Reviewing fund options" },
    { id: "d9", pospId: "p1", customer: "Karan Malhotra", policy: "Life", sum: 3000000, premium: 32000, coa: 4500, margin: 2200, status: "H", expected: "2026-05-30", proposal: "PRP-22309", policyNo: "POL-99813", issued: "2026-05-18", remarks: "Issued, sending docs" },
    { id: "d10", pospId: "p2", customer: "Meera Saxena", policy: "Health", sum: 500000, premium: 9500, coa: 1300, margin: 700, status: "W", expected: "2026-06-05", proposal: "PRP-22310", policyNo: "", issued: "", remarks: "KYC done" },
    { id: "d11", pospId: "p3", customer: "Sanjay Verma", policy: "Motor", sum: 600000, premium: 8500, coa: 1100, margin: 550, status: "H", expected: "2026-05-24", proposal: "PRP-22311", policyNo: "POL-99814", issued: "2026-05-17", remarks: "Issued" },
    { id: "d12", pospId: "p4", customer: "Ritu Agarwal", policy: "Term", sum: 7500000, premium: 18500, coa: 2500, margin: 1300, status: "W", expected: "2026-06-20", proposal: "PRP-22312", policyNo: "", issued: "", remarks: "Medical scheduled" },
    { id: "d13", pospId: "p1", customer: "Naveen Khanna", policy: "Travel", sum: 1500000, premium: 3800, coa: 500, margin: 280, status: "H", expected: "2026-05-26", proposal: "PRP-22313", policyNo: "POL-99815", issued: "2026-05-19", remarks: "Europe trip, issued" },
    { id: "d14", pospId: "p2", customer: "Pooja Saxena", policy: "Travel", sum: 1000000, premium: 2200, coa: 300, margin: 180, status: "W", expected: "2026-06-08", proposal: "PRP-22314", policyNo: "", issued: "", remarks: "Family Asia trip" },
    { id: "d15", pospId: "p3", customer: "Harish Goel", policy: "Travel", sum: 800000, premium: 1900, coa: 250, margin: 150, status: "C", expected: "2026-07-12", proposal: "PRP-22315", policyNo: "", issued: "", remarks: "Solo trip, still deciding" },
    { id: "d16", pospId: "p1", customer: "Sameer Bhatia", policy: "Personal Loan", sum: 800000, premium: 0, coa: 8000, margin: 12000, status: "H", expected: "2026-05-28", proposal: "PRP-22316", policyNo: "LOAN-44012", issued: "2026-05-15", remarks: "Disbursed, 14% APR" },
    { id: "d17", pospId: "p2", customer: "Geeta Mishra", policy: "Personal Loan", sum: 500000, premium: 0, coa: 5000, margin: 7500, status: "W", expected: "2026-06-02", proposal: "PRP-22317", policyNo: "", issued: "", remarks: "KYC done, bank verifying" },
    { id: "d18", pospId: "p4", customer: "Ashok Pandey", policy: "Home Loan", sum: 5000000, premium: 0, coa: 50000, margin: 75000, status: "H", expected: "2026-06-15", proposal: "PRP-22318", policyNo: "", issued: "", remarks: "Property docs pending" },
    { id: "d19", pospId: "p3", customer: "Lakshmi Rao", policy: "Home Loan", sum: 7500000, premium: 0, coa: 75000, margin: 110000, status: "W", expected: "2026-07-10", proposal: "PRP-22319", policyNo: "", issued: "", remarks: "Bank shortlist made" },
    { id: "d20", pospId: "p4", customer: "Bharat Industries", policy: "Business Loan", sum: 2500000, premium: 0, coa: 25000, margin: 40000, status: "C", expected: "2026-08-20", proposal: "PRP-22320", policyNo: "", issued: "", remarks: "Awaiting CA financials" },
    { id: "d21", pospId: "p2", customer: "GreenTech LLP", policy: "Business Loan", sum: 1200000, premium: 0, coa: 12000, margin: 18000, status: "H", expected: "2026-05-30", proposal: "PRP-22321", policyNo: "LOAN-44013", issued: "2026-05-12", remarks: "Disbursed" },
  ],
};
