import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCrm } from '@/core/providers/CrmProvider';
import { Card } from '@/shared/components/Card';
import { EmptyState } from '@/shared/components/EmptyState';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageHeader } from '@/shared/components/PageHeader';
import { computeCommissions, marginPercent } from '@/shared/utils/crm-calculations';
import { fmtINR } from '@/shared/utils/formatters';
import { Colors } from '@/theme/colors';
import { Radius, Spacing } from '@/theme/spacing';

export default function CommissionsScreen() {
  const { allDeals, posp, loading, refresh } = useCrm();
  const [refreshing, setRefreshing] = useState(false);
  const rows = useMemo(() => computeCommissions(allDeals, posp), [allDeals, posp]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => ({
          premium: acc.premium + row.premium,
          coa: acc.coa + row.coa,
          margin: acc.margin + row.margin,
          dealCount: acc.dealCount + row.dealCount,
          issued: acc.issued + row.issued,
        }),
        { premium: 0, coa: 0, margin: 0, dealCount: 0, issued: 0 },
      ),
    [rows],
  );

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
        <PageHeader title="Commissions" subtitle="COA and retained margin by POSP" />

        <Card>
          {rows.length === 0 ? (
            <EmptyState message="No commission data available." />
          ) : (
            <>
              {rows.map((row) => (
                <View key={row.posp.id} style={styles.row}>
                  <View style={styles.header}>
                    <Text style={styles.name}>{row.posp.name}</Text>
                    <Text style={styles.code}>{row.posp.code}</Text>
                  </View>
                  <View style={styles.stats}>
                    <View style={styles.stat}>
                      <Text style={styles.statLabel}>Premium</Text>
                      <Text style={styles.statValue}>{fmtINR(row.premium)}</Text>
                    </View>
                    <View style={styles.stat}>
                      <Text style={styles.statLabel}>COA</Text>
                      <Text style={styles.statValue}>{fmtINR(row.coa)}</Text>
                    </View>
                    <View style={styles.stat}>
                      <Text style={styles.statLabel}>Margin</Text>
                      <Text style={styles.statValue}>{fmtINR(row.margin)}</Text>
                    </View>
                  </View>
                  <Text style={styles.footer}>
                    {row.dealCount} deals · {row.issued} issued · Margin {marginPercent(row.margin, row.premium)}
                  </Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  {fmtINR(totals.premium)} · Margin {marginPercent(totals.margin, totals.premium)}
                </Text>
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
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primaryLight,
  },
  header: {
    marginBottom: Spacing.md,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  code: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  stat: {
    flex: 1,
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
  footer: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalRow: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.lg,
    borderTopWidth: 2,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  totalValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
});
