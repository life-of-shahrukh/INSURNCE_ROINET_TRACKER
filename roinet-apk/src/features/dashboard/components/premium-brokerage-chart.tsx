import { StyleSheet, Text, View } from 'react-native';

import type { Deal } from '@/shared/types/crm.types';
import { fmtINRShort } from '@/shared/utils/formatters';
import { Colors } from '@/theme/colors';
import { Radius, Spacing } from '@/theme/spacing';

interface PremiumBrokerageChartProps {
  deals: Deal[];
}

const CHART_HEIGHT = 140;

export function PremiumBrokerageChart({ deals }: PremiumBrokerageChartProps) {
  const policySums: Record<string, { premium: number; brokerage: number }> = {};
  deals.forEach((d) => {
    if (!policySums[d.policy]) {
      policySums[d.policy] = { premium: 0, brokerage: 0 };
    }
    policySums[d.policy].premium += +d.premium || 0;
    policySums[d.policy].brokerage += +d.brokerage || 0;
  });

  const items = Object.entries(policySums)
    .map(([label, values]) => ({ label, ...values }))
    .sort((a, b) => b.premium - a.premium);

  const max = Math.max(...items.flatMap((i) => [i.premium, i.brokerage]), 1);

  if (items.length === 0) {
    return <Text style={styles.empty}>No premium data yet.</Text>;
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: Colors.primaryLight }]} />
          <Text style={styles.legendText}>Premium</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#7b5ea7' }]} />
          <Text style={styles.legendText}>Brokerage</Text>
        </View>
      </View>
      <View style={[styles.chart, { height: CHART_HEIGHT }]}>
        {items.map((item) => {
          const premiumHeight = Math.max(6, (item.premium / max) * CHART_HEIGHT);
          const brokerageHeight = Math.max(6, (item.brokerage / max) * CHART_HEIGHT);
          return (
            <View key={item.label} style={styles.column}>
              <View style={styles.barPair}>
                <View style={[styles.barTrack, { height: CHART_HEIGHT }]}>
                  <View style={[styles.barFill, styles.premiumBar, { height: premiumHeight }]} />
                </View>
                <View style={[styles.barTrack, { height: CHART_HEIGHT }]}>
                  <View style={[styles.barFill, styles.brokerageBar, { height: brokerageHeight }]} />
                </View>
              </View>
              <Text style={styles.barLabel} numberOfLines={2}>
                {item.label}
              </Text>
              <Text style={styles.barValue}>{fmtINRShort(item.premium)}</Text>
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
  legend: {
    flexDirection: 'row',
    gap: Spacing.lg,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
  },
  legendText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    minWidth: 52,
  },
  barPair: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'flex-end',
  },
  barTrack: {
    width: 14,
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderTopLeftRadius: Radius.sm,
    borderTopRightRadius: Radius.sm,
    minHeight: 6,
  },
  premiumBar: {
    backgroundColor: Colors.primaryLight,
  },
  brokerageBar: {
    backgroundColor: '#7b5ea7',
  },
  barLabel: {
    fontSize: 10,
    color: Colors.text,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 13,
  },
  barValue: {
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
});
