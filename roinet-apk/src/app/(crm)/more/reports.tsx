import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCrm } from '@/core/providers/CrmProvider';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { EmptyState } from '@/shared/components/EmptyState';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageHeader } from '@/shared/components/PageHeader';
import { computePolicySummary, marginPercent } from '@/shared/utils/crm-calculations';
import { shareCsvContent } from '@/shared/utils/export-csv';
import { fmtINR } from '@/shared/utils/formatters';
import { Colors } from '@/theme/colors';
import { Radius, Spacing } from '@/theme/spacing';

export default function ReportsScreen() {
  const { allDeals, loading, refresh, exportCsv } = useCrm();
  const [refreshing, setRefreshing] = useState(false);
  const rows = useMemo(() => computePolicySummary(allDeals), [allDeals]);

  const totals = rows.reduce(
    (acc, r) => ({
      count: acc.count + r.count,
      premium: acc.premium + r.premium,
      coa: acc.coa + r.coa,
      margin: acc.margin + r.margin,
    }),
    { count: 0, premium: 0, coa: 0, margin: 0 },
  );

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  async function handleExport() {
    const csv = await exportCsv();
    await shareCsvContent('roinet-report.csv', csv);
  }

  if (loading && !refreshing) {
    return <LoadingState />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}>
        <PageHeader
          title="Reports"
          subtitle="Policy-level analytics and export"
          actions={<Button title="Export CSV" variant="secondary" onPress={() => void handleExport()} />}
        />

        <Card title="Conversion Snapshot">
          <View style={styles.snapshotRow}>
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotLabel}>Total Deals</Text>
              <Text style={styles.snapshotValue}>{totals.count}</Text>
            </View>
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotLabel}>Total Premium</Text>
              <Text style={styles.snapshotValue}>{fmtINR(totals.premium)}</Text>
            </View>
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotLabel}>Margin %</Text>
              <Text style={styles.snapshotValue}>{marginPercent(totals.margin, totals.premium)}</Text>
            </View>
          </View>
        </Card>

        <Card title="Summary by Policy Type">
          {rows.length === 0 ? (
            <EmptyState message="No policy data to report on." />
          ) : (
            <>
              {rows.map((row) => (
                <View key={row.policy} style={styles.row}>
                  <View style={styles.header}>
                    <Text style={styles.policy}>{row.policy}</Text>
                    <Text style={styles.count}>{row.count} deals</Text>
                  </View>
                  <View style={styles.stats}>
                    <View>
                      <Text style={styles.statLabel}>Premium</Text>
                      <Text style={styles.statValue}>{fmtINR(row.premium)}</Text>
                    </View>
                    <View>
                      <Text style={styles.statLabel}>COA</Text>
                      <Text style={styles.statValue}>{fmtINR(row.coa)}</Text>
                    </View>
                    <View>
                      <Text style={styles.statLabel}>Margin</Text>
                      <Text style={styles.statValue}>{fmtINR(row.margin)}</Text>
                    </View>
                    <View>
                      <Text style={styles.statLabel}>Margin %</Text>
                      <Text style={styles.statValue}>{marginPercent(row.margin, row.premium)}</Text>
                    </View>
                  </View>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total ({totals.count} deals)</Text>
                <Text style={styles.totalValue}>{fmtINR(totals.premium)} premium</Text>
              </View>
            </>
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
  snapshotRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  snapshotItem: {
    flex: 1,
    backgroundColor: Colors.mutedBg,
    borderRadius: Radius.sm,
    padding: Spacing.md,
  },
  snapshotLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  snapshotValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 4,
  },
  row: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  policy: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  count: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 2,
  },
  totalRow: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 2,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
});
