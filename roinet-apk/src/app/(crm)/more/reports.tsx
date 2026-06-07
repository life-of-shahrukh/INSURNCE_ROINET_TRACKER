import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCrm } from '@/core/providers/CrmProvider';
import { Card } from '@/shared/components/Card';
import { EmptyState } from '@/shared/components/EmptyState';
import { LoadingState } from '@/shared/components/LoadingState';
import { computePolicySummary } from '@/shared/utils/crm-calculations';
import { fmtINR } from '@/shared/utils/formatters';
import { Colors } from '@/theme/colors';
import { Radius, Spacing } from '@/theme/spacing';

export default function ReportsScreen() {
  const { deals, loading, refresh } = useCrm();
  const [refreshing, setRefreshing] = useState(false);
  const rows = useMemo(() => computePolicySummary(deals), [deals]);

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  if (loading && !refreshing) {
    return <LoadingState />;
  }

  const totals = rows.reduce(
    (acc, r) => ({
      count: acc.count + r.count,
      premium: acc.premium + r.premium,
      margin: acc.margin + r.margin,
    }),
    { count: 0, premium: 0, margin: 0 },
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}>
        <Card title="Policy Summary">
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
                      <Text style={styles.statLabel}>Margin</Text>
                      <Text style={styles.statValue}>{fmtINR(row.margin)}</Text>
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
    gap: Spacing.xxxl,
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
