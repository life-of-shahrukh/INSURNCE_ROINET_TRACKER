import { StyleSheet, Text, View } from 'react-native';

import type { Deal } from '@/shared/types/crm.types';
import { computePremiumBands } from '@/shared/utils/crm-calculations';
import { Colors } from '@/theme/colors';
import { Radius, Spacing } from '@/theme/spacing';

interface PremiumBandChartProps {
  deals: Deal[];
}

const CHART_HEIGHT = 120;

export function PremiumBandChart({ deals }: PremiumBandChartProps) {
  const bands = computePremiumBands(deals);
  const max = Math.max(...bands.map((b) => b.count), 1);

  if (deals.length === 0) {
    return <Text style={styles.empty}>No deals to chart yet.</Text>;
  }

  return (
    <View style={styles.wrap}>
      <View style={[styles.chart, { height: CHART_HEIGHT }]}>
        {bands.map((band) => {
          const barHeight = Math.max(8, (band.count / max) * CHART_HEIGHT);
          return (
            <View key={band.label} style={styles.column}>
              <Text style={styles.count}>{band.count}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { height: barHeight }]} />
              </View>
              <Text style={styles.label} numberOfLines={2}>
                {band.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.sm,
  },
  empty: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    minWidth: 40,
  },
  count: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  barTrack: {
    width: '80%',
    height: CHART_HEIGHT,
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    backgroundColor: Colors.primaryLight,
    borderTopLeftRadius: Radius.sm,
    borderTopRightRadius: Radius.sm,
    minHeight: 8,
  },
  label: {
    fontSize: 9,
    color: Colors.text,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 12,
  },
});
