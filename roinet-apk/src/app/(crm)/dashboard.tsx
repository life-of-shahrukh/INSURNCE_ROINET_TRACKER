import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatusBreakdown } from '@/features/dashboard/components/StatusBreakdown';
import { DealFormModal } from '@/features/deals/components/deal-form-modal';
import { DealListItem } from '@/features/deals/components/DealListItem';
import { useAuth } from '@/core/providers/AuthProvider';
import { useCrm } from '@/core/providers/CrmProvider';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { EmptyState } from '@/shared/components/EmptyState';
import { KpiCard } from '@/shared/components/KpiCard';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageHeader } from '@/shared/components/PageHeader';
import { computeCommissions, computeDashboardKpis, computePolicySummary, pospName } from '@/shared/utils/crm-calculations';
import { shareCsvContent } from '@/shared/utils/export-csv';
import { fmtINR, fmtINRShort } from '@/shared/utils/formatters';
import type { Deal } from '@/shared/types/crm.types';
import { Colors } from '@/theme/colors';
import { Spacing } from '@/theme/spacing';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, isAdmin, logout } = useAuth();
  const { deals, posp, loading, error, refresh, exportCsv } = useCrm();
  const [refreshing, setRefreshing] = useState(false);
  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [editDeal, setEditDeal] = useState<Deal | null>(null);

  const kpis = useMemo(() => computeDashboardKpis(deals, posp), [deals, posp]);
  const policySummary = useMemo(() => computePolicySummary(deals).slice(0, 5), [deals]);
  const topPosps = useMemo(() => computeCommissions(deals, posp).slice(0, 5), [deals, posp]);

  const recent = useMemo(
    () =>
      [...deals]
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
        .slice(0, 5),
    [deals],
  );

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  async function handleExport() {
    const csv = await exportCsv();
    await shareCsvContent('roinet-deals.csv', csv);
  }

  function openNewDeal() {
    setEditDeal(null);
    setDealModalOpen(true);
  }

  function openDeal(deal: Deal) {
    setEditDeal(deal);
    setDealModalOpen(true);
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
          title="Dashboard"
          subtitle="Overview of your sales performance"
          actions={
            <View style={styles.headerActions}>
              {isAdmin ? (
                <Button title="Export" variant="secondary" onPress={() => void handleExport()} />
              ) : null}
              <Button title="+ New Deal" onPress={openNewDeal} />
              <Badge label={isAdmin ? 'Admin' : 'POSP'} variant="muted" />
            </View>
          }
        />

        {error ? (
          <Card>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorHint}>Pull down to retry, or enable EXPO_PUBLIC_USE_MOCK=true for offline demo.</Text>
          </Card>
        ) : null}

        <View style={styles.kpiGrid}>
          <View style={styles.kpiRow}>
            <KpiCard label="Total Premium" value={fmtINRShort(kpis.totalPremium)} sub={`${kpis.dealCount} deals tracked`} />
            <KpiCard label="Retained Margin" value={fmtINRShort(kpis.totalMargin)} sub="After COA" variant="success" />
          </View>
          <View style={styles.kpiRow}>
            <KpiCard label="Hot Deals" value={String(kpis.hotDeals)} sub="Likely to close soon" variant="hot" />
            {isAdmin ? (
              <KpiCard label="Active POSPs" value={String(kpis.activePosps)} sub="Selling now" variant="warm" />
            ) : (
              <KpiCard label="Conversion" value={`${kpis.conv}%`} sub={`${kpis.issued} issued / ${kpis.dealCount}`} />
            )}
          </View>
          {isAdmin ? (
            <View style={styles.kpiRow}>
              <KpiCard label="Conversion" value={`${kpis.conv}%`} sub={`${kpis.issued} issued / ${kpis.dealCount}`} />
            </View>
          ) : null}
        </View>

        <Card title="Deals by Status">
          <StatusBreakdown deals={deals} />
        </Card>

        {isAdmin && policySummary.length > 0 ? (
          <Card title="Premium by Policy Type">
            {policySummary.map((row) => (
              <View key={row.policy} style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{row.policy}</Text>
                <Text style={styles.summaryValue}>{fmtINR(row.premium)}</Text>
              </View>
            ))}
          </Card>
        ) : null}

        {isAdmin && topPosps.length > 0 ? (
          <Card title="Top POSPs by Premium">
            {topPosps.map((row) => (
              <View key={row.posp.id} style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{row.posp.name}</Text>
                <Text style={styles.summaryValue}>{fmtINRShort(row.premium)}</Text>
              </View>
            ))}
          </Card>
        ) : null}

        <Card title="Recent Deals">
          {recent.length === 0 ? (
            <EmptyState message="No deals yet. Tap + New Deal to add your first deal." />
          ) : (
            recent.map((d) => (
              <DealListItem key={d.id} deal={d} pospLabel={pospName(posp, d.pospId)} onPress={() => openDeal(d)} />
            ))
          )}
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Signed in as {user?.email}</Text>
          {!isAdmin ? (
            <Button
              title="Logout"
              variant="secondary"
              onPress={async () => {
                await logout();
                router.replace('/login');
              }}
              style={styles.logoutBtn}
            />
          ) : null}
        </View>
      </ScrollView>

      <DealFormModal visible={dealModalOpen} deal={editDeal} onClose={() => setDealModalOpen(false)} />
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
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  kpiGrid: {
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    marginBottom: Spacing.sm,
  },
  errorHint: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  footer: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
  },
  footerText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  logoutBtn: {
    marginTop: Spacing.md,
    alignSelf: 'center',
  },
});
