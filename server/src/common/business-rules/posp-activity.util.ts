/**
 * POSP active/inactive is derived from deal activity — not a manual flag.
 * See `.cursor/rules/posp-activity.mdc`.
 */

/** Rolling window: no qualifying deal within this period → inactive */
export const POSP_INACTIVITY_THRESHOLD_DAYS = 30;

const MS_PER_DAY = 86_400_000;

export function inactivityThresholdDate(now: Date = new Date()): Date {
  return new Date(now.getTime() - POSP_INACTIVITY_THRESHOLD_DAYS * MS_PER_DAY);
}

/**
 * Latest deal timestamp for a POSP (currently deal.createdAt).
 */
export function resolveLastBusinessAt(
  lastDealAt: Date | null | undefined,
  storedLastBusinessAt: Date | null | undefined,
): Date | null {
  if (lastDealAt && storedLastBusinessAt) {
    return lastDealAt > storedLastBusinessAt
      ? lastDealAt
      : storedLastBusinessAt;
  }
  return lastDealAt ?? storedLastBusinessAt ?? null;
}

/**
 * A POSP is **active** when they have logged at least one deal within the last
 * 30 days. New joiners with no deals yet get a grace period until 30 days
 * after their join date.
 */
export function isPospActiveByDealActivity(
  lastBusinessAt: Date | null | undefined,
  options?: { joined?: Date; now?: Date },
): boolean {
  const now = options?.now ?? new Date();
  const threshold = inactivityThresholdDate(now);

  if (lastBusinessAt && lastBusinessAt >= threshold) {
    return true;
  }

  const joined = options?.joined;
  if (joined && !lastBusinessAt && joined >= threshold) {
    return true;
  }

  return false;
}
