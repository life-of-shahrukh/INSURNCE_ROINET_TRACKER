import type { ClosureTimeline, HeatStatus } from '@/lib/api/lead-api';

export interface ClosureTimelineMeta {
  key: ClosureTimeline;
  label: string;
  subtitle: string;
  color: string;
  bgColor: string;
  borderColor: string;
  heatStatus: HeatStatus;
  cssClass: 'hot' | 'warm' | 'cold' | 'later';
}

export const CLOSURE_TIMELINE_ORDER: ClosureTimeline[] = [
  'THIS_MONTH',
  'T_PLUS_1',
  'T_PLUS_2',
  'LATER',
];

export const CLOSURE_TIMELINE_META: Record<ClosureTimeline, ClosureTimelineMeta> = {
  THIS_MONTH: {
    key: 'THIS_MONTH',
    label: 'Hot',
    subtitle: 'This month',
    color: '#e63946',
    bgColor: '#e6394612',
    borderColor: '#e63946',
    heatStatus: 'H',
    cssClass: 'hot',
  },
  T_PLUS_1: {
    key: 'T_PLUS_1',
    label: 'Warm',
    subtitle: 'Next month (T+1)',
    color: '#f4a261',
    bgColor: '#f4a26118',
    borderColor: '#f4a261',
    heatStatus: 'W',
    cssClass: 'warm',
  },
  T_PLUS_2: {
    key: 'T_PLUS_2',
    label: 'Cold',
    subtitle: 'Within 2 months (T+2)',
    color: '#3282b8',
    bgColor: '#3282b812',
    borderColor: '#3282b8',
    heatStatus: 'C',
    cssClass: 'cold',
  },
  LATER: {
    key: 'LATER',
    label: 'Later',
    subtitle: 'More than 2 months',
    color: '#8e8e8e',
    bgColor: '#8e8e8e14',
    borderColor: '#8e8e8e',
    heatStatus: 'L',
    cssClass: 'later',
  },
};

export const CLOSURE_TIMELINE_COLUMNS = CLOSURE_TIMELINE_ORDER.map(
  (key) => CLOSURE_TIMELINE_META[key],
);

const HEAT_TO_TIMELINE: Record<HeatStatus, ClosureTimeline> = {
  H: 'THIS_MONTH',
  W: 'T_PLUS_1',
  C: 'T_PLUS_2',
  L: 'LATER',
};

/** Bucket expected close date into Hot / Warm / Cold / Later. */
export function deriveClosureTimelineFromDate(
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

export function heatStatusToClosureTimeline(heat: HeatStatus): ClosureTimeline {
  return HEAT_TO_TIMELINE[heat] ?? 'THIS_MONTH';
}

export function closureTimelineToHeatStatus(
  timeline: ClosureTimeline,
): HeatStatus {
  return CLOSURE_TIMELINE_META[timeline].heatStatus;
}

export function getClosureTimelineMeta(
  timeline: ClosureTimeline | undefined | null,
): ClosureTimelineMeta {
  if (timeline && CLOSURE_TIMELINE_META[timeline]) {
    return CLOSURE_TIMELINE_META[timeline];
  }
  return CLOSURE_TIMELINE_META.THIS_MONTH;
}

/** Representative close date for a timeline bucket (YYYY-MM-DD). */
export function suggestedExpectedCloseDateForTimeline(
  timeline: ClosureTimeline,
  reference: Date = new Date(),
): string {
  const d = new Date(reference);
  switch (timeline) {
    case 'THIS_MONTH':
      d.setDate(Math.min(28, d.getDate() + 7));
      break;
    case 'T_PLUS_1':
      d.setMonth(d.getMonth() + 1, 15);
      break;
    case 'T_PLUS_2':
      d.setMonth(d.getMonth() + 2, 15);
      break;
    case 'LATER':
      d.setMonth(d.getMonth() + 4, 1);
      break;
  }
  return d.toISOString().slice(0, 10);
}
