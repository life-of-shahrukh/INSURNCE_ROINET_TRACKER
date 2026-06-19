import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Deal, Posp } from '@/shared/types/crm.types';
import { computePospCoverage, type PospCoverageSlice } from '@/shared/utils/crm-calculations';
import { fmtINR } from '@/shared/utils/formatters';
import { Colors } from '@/theme/colors';
import { Radius, Spacing } from '@/theme/spacing';

interface PospCoverageWidgetProps {
  deals: Deal[];
  posp: Posp[];
}

const SLICES: Array<{ key: PospCoverageSlice; label: string }> = [
  { key: 'national', label: 'National' },
  { key: 'region', label: 'Region' },
  { key: 'asm', label: 'ASM' },
];

export function PospCoverageWidget({ deals, posp }: PospCoverageWidgetProps) {
  const [slice, setSlice] = useState<PospCoverageSlice>('national');
  const rows = useMemo(() => computePospCoverage(deals, posp, slice), [deals, posp, slice]);

  return (
    <View style={styles.wrap}>
      <View style={styles.toggleRow}>
        {SLICES.map((item) => (
          <Pressable
            key={item.key}
            style={[styles.chip, slice === item.key && styles.chipActive]}
            onPress={() => setSlice(item.key)}>
            <Text style={[styles.chipText, slice === item.key && styles.chipTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      {rows.map((row) => (
        <View key={row.key} style={styles.row}>
          <View style={styles.rowHeader}>
            <Text style={styles.rowTitle}>{row.key}</Text>
            <Text style={styles.rowPct}>{row.pct}% active</Text>
          </View>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${row.pct}%` }]} />
          </View>
          <View style={styles.stats}>
            <Text style={styles.stat}>Total {row.total}</Text>
            <Text style={styles.statActive}>Active {row.active}</Text>
            <Text style={styles.stat}>Inactive {row.inactive}</Text>
            {row.newThisMonth > 0 ? <Text style={styles.statNew}>+{row.newThisMonth} new</Text> : null}
          </View>
          <View style={styles.footer}>
            <Text style={styles.footerText}>{row.deals} deals</Text>
            <Text style={styles.footerText}>{fmtINR(row.premium)} premium</Text>
            <Text style={styles.footerText}>{fmtINR(row.brokerage)} brokerage</Text>
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
  toggleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
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
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  rowPct: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  barBg: {
    height: 6,
    backgroundColor: Colors.mutedBg,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: Radius.full,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  stat: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  statActive: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: '600',
  },
  statNew: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  footerText: {
    fontSize: 11,
    color: Colors.text,
  },
});
