import { StyleSheet, Text, View } from 'react-native';

import { DonutChart } from '@/shared/components/donut-chart';
import type { Deal } from '@/shared/types/crm.types';
import { Colors } from '@/theme/colors';
import { Radius, Spacing } from '@/theme/spacing';

interface DealsByStatusChartProps {
  deals: Deal[];
}

const STATUS_META = [
  { key: 'H' as const, label: 'Hot' as const, color: Colors.hot },
  { key: 'W' as const, label: 'Warm' as const, color: Colors.warm },
  { key: 'C' as const, label: 'Cold' as const, color: Colors.cold },
];

type StatusLabel = (typeof STATUS_META)[number]['label'];

export function DealsByStatusChart({ deals }: DealsByStatusChartProps) {
  const counts: Record<StatusLabel, number> = {
    Hot: deals.filter((d) => d.status === 'H').length,
    Warm: deals.filter((d) => d.status === 'W').length,
    Cold: deals.filter((d) => d.status === 'C').length,
  };
  const total = deals.length;
  const segments = STATUS_META.map(({ label, color }) => ({
    label,
    color,
    value: counts[label],
  })).filter((s) => s.value > 0);

  return (
    <View style={styles.wrap}>
      {total === 0 ? (
        <Text style={styles.empty}>No deals to chart yet.</Text>
      ) : (
        <>
          <DonutChart
            segments={segments}
            centerLabel={String(total)}
            centerSubLabel="Total deals"
          />
          <View style={styles.legend}>
            {STATUS_META.map(({ label, color }) => {
              const count = counts[label];
              return (
                <View key={label} style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: color }]} />
                  <Text style={styles.legendLabel}>{label}</Text>
                  <Text style={styles.legendValue}>
                    {count} ({total ? Math.round((count / total) * 100) : 0}%)
                  </Text>
                </View>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.lg,
    alignItems: 'center',
  },
  empty: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
    alignSelf: 'stretch',
  },
  legend: {
    gap: Spacing.sm,
    alignSelf: 'stretch',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
  },
  legendLabel: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
  },
  legendValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
});
