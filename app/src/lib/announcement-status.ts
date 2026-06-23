import type { Announcement } from '@/lib/api/announcement-api';

export type AnnouncementLifecycleStatus =
  | 'inactive'
  | 'scheduled'
  | 'expired'
  | 'live';

/** SQL Server BIT / JSON may arrive as 0/1 or string — normalize for UI. */
export function parseAnnouncementBoolean(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (value === false || value === 0 || value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1';
  }
  return Boolean(value);
}

export function resolveAnnouncementLifecycleStatus(
  announcement: Pick<Announcement, 'isActive' | 'startsAt' | 'expiresAt'>,
  now: Date = new Date(),
): AnnouncementLifecycleStatus {
  if (!parseAnnouncementBoolean(announcement.isActive)) {
    return 'inactive';
  }
  const startsAt = new Date(announcement.startsAt);
  if (startsAt > now) {
    return 'scheduled';
  }
  if (announcement.expiresAt) {
    const expiresAt = new Date(announcement.expiresAt);
    if (expiresAt <= now) {
      return 'expired';
    }
  }
  return 'live';
}
