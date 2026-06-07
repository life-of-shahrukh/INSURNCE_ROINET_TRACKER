import { StyleSheet, Text, View } from 'react-native';

import type { Deal } from '@/shared/types/crm.types';
import { fmtINRShort } from '@/shared/utils/formatters';
import { Colors } from '@/theme/colors';
import { Radius, Spacing } from '@/theme/spacing';

interface PremiumByPolicyChartProps {
  deals: Deal[];
}

const CHART_HEIGHT = 140;

export function PremiumByPolicyChart({ deals }: PremiumByPolicyChartProps) {
  const policySums: Record<string, number> = {};
  deals.forEach((d) => {
    policySums[d.policy] = (policySums[d.policy] || 0) + (+d.premium || 0);
  });

  const items = Object.entries(policySums)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  const max = Math.max(...items.map((i) => i.value), 1);

  if (items.length === 0) {
    return <Text style={styles.empty}>No premium data yet.</Text>;
  }

  return (
    <View style={styles.wrap}>
      <View style={[styles.chart, { height: CHART_HEIGHT }]}>
        {items.map((item) => {
          const barHeight = Math.max(8, (item.value / max) * CHART_HEIGHT);
          return (
            <View key={item.label} style={styles.column}>
              <Text style={styles.barValue}>{fmtINRShort(item.value)}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { height: barHeight }]} />
              </View>
              <Text style={styles.barLabel} numberOfLines={2}>
                {item.label}
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
    gap: Spacing.sm,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    minWidth: 48,
  },
  barValue: {
    fontSize: 9,
    color: Colors.textMuted,
    marginBottom: 4,
    textAlign: 'center',
  },
  barTrack: {
    width: '100%',
    height: CHART_HEIGHT,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    width: '75%',
    backgroundColor: Colors.primaryLight,
    borderTopLeftRadius: Radius.sm,
    borderTopRightRadius: Radius.sm,
    minHeight: 8,
  },
  barLabel: {
    fontSize: 10,
    color: Colors.text,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 13,
  },
});
