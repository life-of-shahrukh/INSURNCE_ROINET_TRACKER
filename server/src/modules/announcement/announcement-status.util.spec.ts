import {
  announcementTargetsRole,
  resolveAnnouncementLifecycleStatus,
} from './announcement-status.util';

describe('resolveAnnouncementLifecycleStatus', () => {
  const base = {
    isActive: true,
    startsAt: new Date('2026-06-01T00:00:00Z'),
    expiresAt: new Date('2026-06-30T00:00:00Z'),
  };

  it('returns inactive when isActive is false', () => {
    expect(
      resolveAnnouncementLifecycleStatus(
        { ...base, isActive: false },
        new Date('2026-06-15T00:00:00Z'),
      ),
    ).toBe('inactive');
  });

  it('returns scheduled before startsAt', () => {
    expect(
      resolveAnnouncementLifecycleStatus(
        base,
        new Date('2026-05-31T00:00:00Z'),
      ),
    ).toBe('scheduled');
  });

  it('returns expired after expiresAt', () => {
    expect(
      resolveAnnouncementLifecycleStatus(
        base,
        new Date('2026-07-01T00:00:00Z'),
      ),
    ).toBe('expired');
  });

  it('returns live when enabled and within schedule', () => {
    expect(
      resolveAnnouncementLifecycleStatus(
        base,
        new Date('2026-06-15T00:00:00Z'),
      ),
    ).toBe('live');
  });
});

describe('announcementTargetsRole', () => {
  it('matches exact role tokens only', () => {
    expect(announcementTargetsRole('POSP,DM,ASM', 'DM')).toBe(true);
    expect(announcementTargetsRole('SUPER_ADMIN', 'DM')).toBe(false);
    expect(announcementTargetsRole('SUPER_ADMIN,NATIONAL_HEAD', 'DM')).toBe(
      false,
    );
  });
});
