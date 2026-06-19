import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Deal } from '@/shared/types/crm.types';
import { fmtINRShort } from '@/shared/utils/formatters';
import { Colors } from '@/theme/colors';
import { Radius, Spacing } from '@/theme/spacing';

interface PremiumBrokerageChartProps {
  deals: Deal[];
}

const CHART_HEIGHT = 130;
const MIN_COLUMN_WIDTH = 64;
const VALUE_ROW_HEIGHT = 16;
const LABEL_ROW_HEIGHT = 34;

export function PremiumBrokerageChart({ deals }: PremiumBrokerageChartProps): React.ReactElement {
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

  const screenWidth = Dimensions.get('window').width;
  const availableWidth = screenWidth - Spacing.xxl * 2 - Spacing.xl * 2;
  const neededWidth = items.length * MIN_COLUMN_WIDTH;
  const shouldScroll = neededWidth > availableWidth;
  const columnWidth = shouldScroll ? MIN_COLUMN_WIDTH : Math.floor(availableWidth / items.length);
  const contentWidth = shouldScroll ? neededWidth : availableWidth;

  const chartBody = (
    <View style={[styles.row, { width: contentWidth }]}>
      {items.map((item) => {
        const premiumHeight = Math.max(6, (item.premium / max) * CHART_HEIGHT);
        const brokerageHeight = Math.max(6, (item.brokerage / max) * CHART_HEIGHT);

        return (
          <View key={item.label} style={[styles.column, { width: columnWidth }]}>
            <View style={[styles.valueRow, { height: VALUE_ROW_HEIGHT }]}>
              <Text style={styles.valueText} numberOfLines={1}>
                {fmtINRShort(item.premium)}
              </Text>
            </View>

            <View style={[styles.barPair, { height: CHART_HEIGHT }]}>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, styles.premiumBar, { height: premiumHeight }]} />
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, styles.brokerageBar, { height: brokerageHeight }]} />
              </View>
            </View>

            <View style={[styles.labelRow, { minHeight: LABEL_ROW_HEIGHT }]}>
              <Text style={styles.labelText} numberOfLines={2}>
                {item.label}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );

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

      {shouldScroll ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
          {chartBody}
        </ScrollView>
      ) : (
        chartBody
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.md,
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
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  column: {
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  valueRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  valueText: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.textMuted,
    textAlign: 'center',
  },
  barPair: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  barTrack: {
    width: 14,
    height: '100%',
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
  labelRow: {
    width: '100%',
    alignItems: 'center',
    marginTop: 6,
  },
  labelText: {
    fontSize: 10,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 13,
  },
});
