/**
 * Unit tests for frontend filter utilities.
 * Tests getVisibleDimensions and applyFiltersToDeals for all 7 roles.
 */

import {
  getVisibleDimensions,
  applyFiltersToDeals,
  EMPTY_FILTERS,
  type FilterState,
} from '../../lib/filters/filter-utils';
import type { UserRole } from '../../lib/auth-types';
import type { Deal } from '../../lib/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeDeal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: 'deal-1',
    pospId: 'posp-1',
    customer: 'Test Customer',
    policy: 'Term Life',
    sum: 500000,
    premium: 12000,
    coa: 1200,
    margin: 600,
    status: 'H',
    expected: new Date('2026-07-01'),
    proposal: 'P-001',
    policyNo: 'POL-001',
    issued: undefined,
    remarks: '',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

// ── getVisibleDimensions ──────────────────────────────────────────────────────

describe('getVisibleDimensions', () => {
  const allRoles: UserRole[] = [
    'SUPER_ADMIN', 'NATIONAL_HEAD', 'ZH', 'RH', 'ASM', 'DM', 'POSP',
  ];

  it.each(allRoles)('%s gets at least dateRange and dealStatus dimensions', (role: UserRole) => {
    const dims = getVisibleDimensions(role, EMPTY_FILTERS);
    const keys = dims.map((d) => d.key);
    expect(keys).toContain('dateRange');
    expect(keys).toContain('dealStatus');
    expect(keys).toContain('productLine');
  });

  it('SUPER_ADMIN sees zone, region, area, district, posp dimensions', () => {
    const dims = getVisibleDimensions('SUPER_ADMIN', EMPTY_FILTERS);
    const keys = dims.map((d) => d.key);
    expect(keys).toContain('zone');
    expect(keys).toContain('region');
    expect(keys).toContain('area');
    expect(keys).toContain('district');
    expect(keys).toContain('posp');
  });

  it('NATIONAL_HEAD sees zone + all below', () => {
    const dims = getVisibleDimensions('NATIONAL_HEAD', EMPTY_FILTERS);
    const keys = dims.map((d) => d.key);
    expect(keys).toContain('zone');
    expect(keys).toContain('region');
  });

  it('ZH does NOT see zone filter (they own their zone)', () => {
    const dims = getVisibleDimensions('ZH', EMPTY_FILTERS);
    const keys = dims.map((d) => d.key);
    expect(keys).not.toContain('zone');
    expect(keys).toContain('region');
  });

  it('RH does NOT see zone or region filters', () => {
    const dims = getVisibleDimensions('RH', EMPTY_FILTERS);
    const keys = dims.map((d) => d.key);
    expect(keys).not.toContain('zone');
    expect(keys).not.toContain('region');
    expect(keys).toContain('area');
  });

  it('ASM does NOT see zone/region/area filters', () => {
    const dims = getVisibleDimensions('ASM', EMPTY_FILTERS);
    const keys = dims.map((d) => d.key);
    expect(keys).not.toContain('zone');
    expect(keys).not.toContain('region');
    expect(keys).not.toContain('area');
    expect(keys).toContain('district');
    expect(keys).toContain('posp');
  });

  it('DM only sees posp (not geography) but does see product/status', () => {
    const dims = getVisibleDimensions('DM', EMPTY_FILTERS);
    const keys = dims.map((d) => d.key);
    expect(keys).toContain('posp');
    expect(keys).not.toContain('district');
  });

  it('POSP does NOT see posp or geography filters', () => {
    const dims = getVisibleDimensions('POSP', EMPTY_FILTERS);
    const keys = dims.map((d) => d.key);
    expect(keys).not.toContain('zone');
    expect(keys).not.toContain('region');
    expect(keys).not.toContain('area');
    expect(keys).not.toContain('district');
    expect(keys).not.toContain('posp');
  });

  it('POSP and DM do NOT see kycStatus (ASM+ only)', () => {
    const pospDims = getVisibleDimensions('POSP', EMPTY_FILTERS).map((d) => d.key);
    const dmDims = getVisibleDimensions('DM', EMPTY_FILTERS).map((d) => d.key);
    expect(pospDims).not.toContain('kycStatus');
    expect(dmDims).not.toContain('kycStatus');
  });

  it('ASM+ sees kycStatus filter', () => {
    const dims = getVisibleDimensions('ASM', EMPTY_FILTERS).map((d) => d.key);
    expect(dims).toContain('kycStatus');
  });

  it('productSubType options are populated when productLine is selected', () => {
    const filters: FilterState = { ...EMPTY_FILTERS, productLine: 'HEALTH' };
    const dims = getVisibleDimensions('POSP', filters);
    const subType = dims.find((d) => d.key === 'productSubType');
    expect(subType).toBeDefined();
    expect(subType?.options.length).toBeGreaterThan(1);
    expect(subType?.options.some((o) => o.value === 'FAMILY_FLOATER')).toBe(true);
  });
});

// ── applyFiltersToDeals ───────────────────────────────────────────────────────

describe('applyFiltersToDeals', () => {
  const deals: Deal[] = [
    makeDeal({ id: 'd1', status: 'H', premium: 5000, issued: undefined }),
    makeDeal({ id: 'd2', status: 'W', premium: 15000, issued: new Date('2026-05-01') }),
    makeDeal({ id: 'd3', status: 'C', premium: 60000, issued: undefined }),
    makeDeal({ id: 'd4', status: 'H', premium: 120000, issued: new Date('2026-06-01') }),
  ];

  it('empty filters returns all deals', () => {
    const result = applyFiltersToDeals(deals, EMPTY_FILTERS);
    expect(result).toHaveLength(4);
  });

  it('dealStatus H returns only hot deals', () => {
    const result = applyFiltersToDeals(deals, { ...EMPTY_FILTERS, dealStatus: 'H' });
    expect(result).toHaveLength(2);
    expect(result.every((d) => d.status === 'H')).toBe(true);
  });

  it('policyStatus issued returns only issued deals', () => {
    const result = applyFiltersToDeals(deals, { ...EMPTY_FILTERS, policyStatus: 'issued' });
    expect(result).toHaveLength(2);
    expect(result.every((d) => !!d.issued)).toBe(true);
  });

  it('policyStatus pending returns only unissued deals', () => {
    const result = applyFiltersToDeals(deals, { ...EMPTY_FILTERS, policyStatus: 'pending' });
    expect(result).toHaveLength(2);
    expect(result.every((d) => !d.issued)).toBe(true);
  });

  it('premium range 10000-25000 filters correctly', () => {
    const result = applyFiltersToDeals(deals, {
      ...EMPTY_FILTERS,
      premiumRange: '10000-25000',
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('d2');
  });

  it('premium range 100000+ includes deals with premium >= 100000', () => {
    const result = applyFiltersToDeals(deals, {
      ...EMPTY_FILTERS,
      premiumRange: '100000+',
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('d4');
  });

  it('combined filters are AND-ed', () => {
    const result = applyFiltersToDeals(deals, {
      ...EMPTY_FILTERS,
      dealStatus: 'H',
      policyStatus: 'issued',
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('d4');
  });

  it('dateRange year filters deals by expected date within current year', () => {
    const result = applyFiltersToDeals(deals, { ...EMPTY_FILTERS, dateRange: 'year' });
    // all deals have expected in 2026, current year
    expect(result.length).toBeGreaterThan(0);
  });
});
