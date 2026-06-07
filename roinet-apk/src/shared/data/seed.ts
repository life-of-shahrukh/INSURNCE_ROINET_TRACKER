import type { CrmState } from '@/shared/types/crm.types';

export const SEED: CrmState = {
  posp: [
    { id: 'p1', name: 'Anjali Sharma', code: 'POSP-1001', mobile: '9876543210', email: 'anjali@example.com', joined: '2024-03-15', active: true },
    { id: 'p2', name: 'Rohit Kumar', code: 'POSP-1002', mobile: '9123456780', email: 'rohit@example.com', joined: '2024-06-02', active: true },
    { id: 'p3', name: 'Priya Iyer', code: 'POSP-1003', mobile: '9988776655', email: 'priya@example.com', joined: '2025-01-20', active: true },
    { id: 'p4', name: 'Vikram Singh', code: 'POSP-1004', mobile: '9000111222', email: 'vikram@example.com', joined: '2023-11-10', active: true },
    { id: 'p5', name: 'Neha Patel', code: 'POSP-1005', mobile: '9888777666', email: 'neha@example.com', joined: '2025-04-01', active: false },
  ],
  deals: [
    { id: 'd1', pospId: 'p1', customer: 'Rajesh Mehta', policy: 'Life', sum: 5000000, premium: 45000, coa: 6000, margin: 3000, status: 'W', expected: '2026-06-15', proposal: 'PRP-22301', policyNo: '', issued: null, remarks: 'Awaiting medical', createdAt: '2026-05-01', updatedAt: '2026-05-01' },
    { id: 'd2', pospId: 'p1', customer: 'Sunita Desai', policy: 'Health', sum: 1000000, premium: 18000, coa: 2400, margin: 1200, status: 'H', expected: '2026-05-28', proposal: 'PRP-22302', policyNo: '', issued: null, remarks: 'Comparing 2 quotes', createdAt: '2026-05-02', updatedAt: '2026-05-02' },
    { id: 'd3', pospId: 'p2', customer: 'Aditya Kapoor', policy: 'Motor', sum: 800000, premium: 12500, coa: 1500, margin: 800, status: 'H', expected: '2026-05-25', proposal: 'PRP-22303', policyNo: '', issued: null, remarks: 'Documents pending', createdAt: '2026-05-03', updatedAt: '2026-05-03' },
    { id: 'd6', pospId: 'p3', customer: 'Sneha Reddy', policy: 'Travel', sum: 2000000, premium: 4500, coa: 500, margin: 300, status: 'H', expected: '2026-05-22', proposal: 'PRP-22306', policyNo: 'POL-99812', issued: '2026-05-15', remarks: 'Issued', createdAt: '2026-05-04', updatedAt: '2026-05-04' },
    { id: 'd9', pospId: 'p1', customer: 'Karan Malhotra', policy: 'Life', sum: 3000000, premium: 32000, coa: 4500, margin: 2200, status: 'H', expected: '2026-05-30', proposal: 'PRP-22309', policyNo: 'POL-99813', issued: '2026-05-18', remarks: 'Issued, sending docs', createdAt: '2026-05-05', updatedAt: '2026-05-05' },
    { id: 'd11', pospId: 'p3', customer: 'Sanjay Verma', policy: 'Motor', sum: 600000, premium: 8500, coa: 1100, margin: 550, status: 'H', expected: '2026-05-24', proposal: 'PRP-22311', policyNo: 'POL-99814', issued: '2026-05-17', remarks: 'Issued', createdAt: '2026-05-06', updatedAt: '2026-05-06' },
    { id: 'd13', pospId: 'p1', customer: 'Naveen Khanna', policy: 'Travel', sum: 1500000, premium: 3800, coa: 500, margin: 280, status: 'H', expected: '2026-05-26', proposal: 'PRP-22313', policyNo: 'POL-99815', issued: '2026-05-19', remarks: 'Europe trip, issued', createdAt: '2026-05-07', updatedAt: '2026-05-07' },
    { id: 'd4', pospId: 'p2', customer: 'Kavita Nair', policy: 'Health', sum: 1500000, premium: 22000, coa: 3000, margin: 1500, status: 'C', expected: '2026-07-20', proposal: 'PRP-22304', policyNo: '', issued: null, remarks: 'Not responsive', createdAt: '2026-05-08', updatedAt: '2026-05-08' },
    { id: 'd5', pospId: 'p3', customer: 'Mohan Pillai', policy: 'Term', sum: 10000000, premium: 28000, coa: 3500, margin: 1800, status: 'W', expected: '2026-06-10', proposal: 'PRP-22305', policyNo: '', issued: null, remarks: 'Quote sent', createdAt: '2026-05-09', updatedAt: '2026-05-09' },
  ],
};
