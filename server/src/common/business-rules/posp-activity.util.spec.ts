import {
  inactivityThresholdDate,
  isPospActiveByDealActivity,
  POSP_INACTIVITY_THRESHOLD_DAYS,
} from './posp-activity.util';

describe('posp-activity.util', () => {
  const now = new Date('2026-06-21T12:00:00.000Z');

  it('marks POSP active when last deal is within 30 days', () => {
    const lastDeal = new Date('2026-06-01T00:00:00.000Z');
    expect(isPospActiveByDealActivity(lastDeal, { now })).toBe(true);
  });

  it('marks POSP inactive when last deal is older than 30 days', () => {
    const lastDeal = new Date('2026-05-01T00:00:00.000Z');
    expect(isPospActiveByDealActivity(lastDeal, { now })).toBe(false);
  });

  it('gives new joiners without deals a 30-day grace period', () => {
    const joined = new Date('2026-06-10T00:00:00.000Z');
    expect(isPospActiveByDealActivity(null, { joined, now })).toBe(true);
  });

  it('marks no-deal POSPs inactive after join grace expires', () => {
    const joined = new Date('2026-04-01T00:00:00.000Z');
    expect(isPospActiveByDealActivity(null, { joined, now })).toBe(false);
  });

  it('uses a 30-day threshold constant', () => {
    expect(POSP_INACTIVITY_THRESHOLD_DAYS).toBe(30);
    const threshold = inactivityThresholdDate(now);
    const diffDays =
      (now.getTime() - threshold.getTime()) / (24 * 60 * 60 * 1000);
    expect(diffDays).toBe(30);
  });
});
