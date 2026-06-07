import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Deal, Manager, Posp } from '@/shared/types/crm.types';
import { computePgmRows, type PgmGroupBy } from '@/shared/utils/crm-calculations';
import { fmtINR } from '@/shared/utils/formatters';
import { Colors } from '@/theme/colors';
import { Radius, Spacing } from '@/theme/spacing';

interface PgmTableProps {
  deals: Deal[];
  posp: Posp[];
  managers: Manager[];
}

const GROUPS: Array<{ key: PgmGroupBy; label: string }> = [
  { key: 'national', label: 'National' },
  { key: 'asm', label: 'ASM' },
];

export function PgmTable({ deals, posp, managers }: PgmTableProps) {
  const [groupBy, setGroupBy] = useState<PgmGroupBy>('national');
  const rows = useMemo(() => computePgmRows(deals, posp, managers, groupBy), [deals, posp, managers, groupBy]);

  return (
    <View style={styles.wrap}>
      <View style={styles.toggleRow}>
        {GROUPS.map((item) => (
          <Pressable
            key={item.key}
            style={[styles.chip, groupBy === item.key && styles.chipActive]}
            onPress={() => setGroupBy(item.key)}>
            <Text style={[styles.chipText, groupBy === item.key && styles.chipTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      {rows.map((row) => (
        <View key={row.name} style={styles.row}>
          <Text style={styles.name}>{row.name}</Text>
          <View style={styles.metrics}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Premium</Text>
              <Text style={styles.metricValue}>{fmtINR(row.premium)}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Brokerage</Text>
              <Text style={styles.metricValue}>{fmtINR(row.brokerage)}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Retained GM</Text>
              <Text style={styles.metricValue}>{fmtINR(row.margin)}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Margin %</Text>
              <Text style={styles.metricValue}>{row.marginPct}</Text>
            </View>
          </View>
          <Text style={styles.deals}>{row.deals} deals</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.mutedBg,
  },
  chipActive: {
    backgroundColor: Colors.primary,
  },
  chipText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  chipTextActive: {
    color: Colors.white,
  },
  row: {
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  metric: {
    minWidth: '42%',
  },
  metricLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  deals: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 6,
  },
});
