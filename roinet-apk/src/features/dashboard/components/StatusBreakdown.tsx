import { StyleSheet, Text, View } from 'react-native';

import type { Deal } from '@/shared/types/crm.types';
import { Colors } from '@/theme/colors';
import { Radius, Spacing } from '@/theme/spacing';

interface StatusBreakdownProps {
  deals: Deal[];
}

export function StatusBreakdown({ deals }: StatusBreakdownProps) {
  const hot = deals.filter((d) => d.status === 'H').length;
  const warm = deals.filter((d) => d.status === 'W').length;
  const cold = deals.filter((d) => d.status === 'C').length;
  const total = deals.length || 1;

  const items = [
    { label: 'Hot', count: hot, color: Colors.hot, pct: Math.round((hot / total) * 100) },
    { label: 'Warm', count: warm, color: Colors.warm, pct: Math.round((warm / total) * 100) },
    { label: 'Cold', count: cold, color: Colors.cold, pct: Math.round((cold / total) * 100) },
  ];

  return (
    <View style={styles.wrap}>
      {items.map((item) => (
        <View key={item.label} style={styles.row}>
          <View style={styles.labelRow}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.count}>{item.count}</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${item.pct}%`, backgroundColor: item.color }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.md,
  },
  row: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
  },
  label: {
    fontSize: 13,
    color: Colors.text,
    flex: 1,
  },
  count: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  track: {
    height: 6,
    backgroundColor: Colors.mutedBg,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.full,
  },
});
