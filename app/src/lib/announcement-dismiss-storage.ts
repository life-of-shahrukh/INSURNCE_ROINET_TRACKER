const STORAGE_PREFIX = 'roinet:announcement-banner-dismissed:';

function buildSignature(announcementIds: string[]): string {
  return [...announcementIds].sort().join(',');
}

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

function readStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
}

/** True when the user dismissed this exact set of active announcements this session. */
export function isAnnouncementBannerDismissed(
  userId: string,
  announcementIds: string[],
): boolean {
  const storage = readStorage();
  if (!storage || announcementIds.length === 0) {
    return false;
  }
  try {
    const stored = storage.getItem(storageKey(userId));
    if (!stored) return false;
    return stored === buildSignature(announcementIds);
  } catch {
    return false;
  }
}

/** Persist dismissal for the current login session (frontend only). */
export function dismissAnnouncementBanner(
  userId: string,
  announcementIds: string[],
): void {
  const storage = readStorage();
  if (!storage || announcementIds.length === 0) {
    return;
  }
  try {
    storage.setItem(storageKey(userId), buildSignature(announcementIds));
  } catch {
    // ignore quota / private mode errors
  }
}

/** Cleared on login/logout so announcements show again next session. */
export function clearAnnouncementBannerDismissals(): void {
  if (typeof window === 'undefined') return;
  try {
    for (const storage of [sessionStorage, localStorage]) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key?.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => storage.removeItem(key));
    }
  } catch {
    // ignore
  }
}
