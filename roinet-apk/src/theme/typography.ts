import { TextStyle } from 'react-native';

import { Colors } from './colors';

export const Typography = {
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  } satisfies TextStyle,
  pageSub: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  } satisfies TextStyle,
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  } satisfies TextStyle,
  kpiLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  } satisfies TextStyle,
  kpiValue: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 6,
  } satisfies TextStyle,
  kpiSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  } satisfies TextStyle,
  badge: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  } satisfies TextStyle,
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 5,
  } satisfies TextStyle,
  body: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
  } satisfies TextStyle,
  bodySmall: {
    fontSize: 12,
    color: Colors.textMuted,
  } satisfies TextStyle,
  authTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  } satisfies TextStyle,
} as const;
