import { StyleSheet, Text, View } from 'react-native';

import type { Deal, Posp } from '@/shared/types/crm.types';
import { fmtINRShort } from '@/shared/utils/formatters';
import { Colors } from '@/theme/colors';
import { Radius, Spacing } from '@/theme/spacing';

interface TopPospChartProps {
  deals: Deal[];
  posp: Posp[];
}

export function TopPospChart({ deals, posp }: TopPospChartProps) {
  const items = posp
    .map((p) => ({
      name: p.name,
      total: deals.filter((d) => d.pospId === p.id).reduce((sum, d) => sum + (+d.premium || 0), 0),
    }))
    .filter((p) => p.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const max = Math.max(...items.map((i) => i.total), 1);

  if (items.length === 0) {
    return <Text style={styles.empty}>No POSP premium data yet.</Text>;
  }

  return (
    <View style={styles.wrap}>
      {items.map((item) => (
        <View key={item.name} style={styles.row}>
          <View style={styles.labelRow}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.value}>{fmtINRShort(item.total)}</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${(item.total / max) * 100}%` }]} />
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
  empty: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  row: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  name: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
  },
  value: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  track: {
    height: 10,
    backgroundColor: Colors.mutedBg,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    minWidth: 8,
  },
});
