export type AnnouncementLifecycleStatus =
  | 'inactive'
  | 'scheduled'
  | 'expired'
  | 'live';

export interface AnnouncementScheduleFields {
  isActive: boolean;
  startsAt: Date;
  expiresAt: Date | null;
}

/** Whether the announcement is enabled and within its schedule window. */
export function resolveAnnouncementLifecycleStatus(
  announcement: AnnouncementScheduleFields,
  now: Date = new Date(),
): AnnouncementLifecycleStatus {
  if (!announcement.isActive) {
    return 'inactive';
  }
  if (announcement.startsAt > now) {
    return 'scheduled';
  }
  if (announcement.expiresAt !== null && announcement.expiresAt <= now) {
    return 'expired';
  }
  return 'live';
}

/** Exact match on comma-separated roles — avoids `contains` matching `DM` inside `SUPER_ADMIN`. */
export function announcementTargetsRole(
  targetRoles: string,
  userRole: string,
): boolean {
  const roles = targetRoles
    .split(',')
    .map((role) => role.trim())
    .filter((role) => role.length > 0);
  return roles.includes(userRole);
}
