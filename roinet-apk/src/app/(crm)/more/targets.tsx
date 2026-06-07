import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCrm } from '@/core/providers/CrmProvider';
import { Badge } from '@/shared/components/Badge';
import { Card } from '@/shared/components/Card';
import { EmptyState } from '@/shared/components/EmptyState';
import { KpiCard } from '@/shared/components/KpiCard';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageHeader } from '@/shared/components/PageHeader';
import { buildTargetRows } from '@/shared/utils/crm-calculations';
import { Colors } from '@/theme/colors';
import { Spacing } from '@/theme/spacing';

export default function TargetsScreen() {
  const { posp, targets, loading, refresh } = useCrm();
  const [refreshing, setRefreshing] = useState(false);

  const rows = useMemo(() => buildTargetRows(posp, targets.asm), [posp, targets.asm]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => ({
          target: acc.target + row.target,
          actual: acc.actual + row.actual,
        }),
        { target: 0, actual: 0 },
      ),
    [rows],
  );

  const totPct = totals.target ? Math.round((totals.actual / totals.target) * 100) : totals.actual ? 100 : 0;
  const gap = totals.actual - totals.target;

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  if (loading && !refreshing) {
    return <LoadingState />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}>
        <PageHeader title="Channel Sourcing Targets" subtitle="ASM recruitment targets for this month" />

        <View style={styles.kpiRow}>
          <KpiCard label="Total Target" value={String(totals.target)} sub="POSPs to recruit this month" />
          <KpiCard label="Recruited So Far" value={String(totals.actual)} sub={`${totPct}% of target`} variant="success" />
        </View>
        <KpiCard
          label="Overall Gap"
          value={`${gap >= 0 ? '+' : ''}${gap}`}
          sub="Actual minus target"
          variant={gap >= 0 ? 'success' : 'hot'}
        />

        <Card title="Area Sales Managers">
          {rows.length === 0 ? (
            <EmptyState message="No recruitment targets configured." />
          ) : (
            rows.map((row) => (
              <View key={row.name} style={styles.row}>
                <View style={styles.rowHeader}>
                  <Text style={styles.name}>{row.name}</Text>
                  <Badge label={`${row.pct}%`} variant={row.pct >= 100 ? 'success' : row.pct >= 60 ? 'warm' : 'hot'} />
                </View>
                <View style={styles.stats}>
                  <Text style={styles.stat}>Target {row.target}</Text>
                  <Text style={styles.stat}>Actual {row.actual}</Text>
                  <Badge label={`${row.gap >= 0 ? '+' : ''}${row.gap}`} variant={row.gap >= 0 ? 'success' : 'hot'} />
                </View>
                <View style={styles.barBg}>
                  <View style={[styles.barFill, { width: `${Math.min(row.pct, 100)}%` }]} />
                </View>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    padding: Spacing.xxl,
    paddingBottom: Spacing.xxxl,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  row: {
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    gap: 6,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.md,
  },
  stat: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  barBg: {
    height: 6,
    backgroundColor: Colors.mutedBg,
    borderRadius: 999,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 999,
  },
});
