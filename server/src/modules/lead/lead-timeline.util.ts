type ClosureTimeline = 'THIS_MONTH' | 'T_PLUS_1' | 'T_PLUS_2' | 'LATER';

const TIMELINE_TO_HEAT: Record<ClosureTimeline, string> = {
  THIS_MONTH: 'H',
  T_PLUS_1: 'W',
  T_PLUS_2: 'C',
  LATER: 'L',
};

const HEAT_TO_TIMELINE: Record<string, ClosureTimeline> = {
  H: 'THIS_MONTH',
  W: 'T_PLUS_1',
  C: 'T_PLUS_2',
  L: 'LATER',
};

/**
 * Derives closure timeline bucket from an expected close date.
 */
export function deriveClosureTimeline(
  expectedCloseDate: Date | string | undefined | null,
): ClosureTimeline {
  if (!expectedCloseDate) return 'THIS_MONTH';

  const expected =
    expectedCloseDate instanceof Date
      ? expectedCloseDate
      : new Date(expectedCloseDate);
  if (isNaN(expected.getTime())) return 'THIS_MONTH';

  const now = new Date();
  const monthsDiff =
    (expected.getFullYear() - now.getFullYear()) * 12 +
    (expected.getMonth() - now.getMonth());

  if (monthsDiff <= 0) return 'THIS_MONTH';
  if (monthsDiff === 1) return 'T_PLUS_1';
  if (monthsDiff === 2) return 'T_PLUS_2';
  return 'LATER';
}

export function closureTimelineToHeatStatus(timeline: ClosureTimeline): string {
  return TIMELINE_TO_HEAT[timeline];
}

export function heatStatusToClosureTimeline(heat: string): ClosureTimeline {
  return HEAT_TO_TIMELINE[heat] ?? 'THIS_MONTH';
}
