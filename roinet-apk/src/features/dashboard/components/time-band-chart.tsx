import { StyleSheet, Text, View } from 'react-native';

import type { Deal } from '@/shared/types/crm.types';
import { computeTimeBandPremiums } from '@/shared/utils/crm-calculations';
import { fmtINRShort } from '@/shared/utils/formatters';
import { Colors } from '@/theme/colors';
import { Radius, Spacing } from '@/theme/spacing';

interface TimeBandChartProps {
  deals: Deal[];
}

const CHART_HEIGHT = 130;

export function TimeBandChart({ deals }: TimeBandChartProps) {
  const rows = computeTimeBandPremiums(deals);
  const max = Math.max(...rows.map((r) => r.premium), 1);
  const hasOpen = rows.some((r) => r.premium > 0);

  if (!hasOpen) {
    return <Text style={styles.empty}>No open pipeline deals.</Text>;
  }

  return (
    <View style={[styles.chart, { height: CHART_HEIGHT }]}>
      {rows.map((row) => {
        const barHeight = Math.max(8, (row.premium / max) * CHART_HEIGHT);
        return (
          <View key={row.key} style={styles.column}>
            <Text style={styles.value}>{fmtINRShort(row.premium)}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { height: barHeight, backgroundColor: row.color }]} />
            </View>
            <Text style={styles.label} numberOfLines={2}>
              {row.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    minWidth: 56,
  },
  value: {
    fontSize: 9,
    color: Colors.textMuted,
    marginBottom: 4,
    textAlign: 'center',
  },
  barTrack: {
    width: '75%',
    height: CHART_HEIGHT,
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderTopLeftRadius: Radius.sm,
    borderTopRightRadius: Radius.sm,
    minHeight: 8,
  },
  label: {
    fontSize: 10,
    color: Colors.text,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 13,
  },
});
