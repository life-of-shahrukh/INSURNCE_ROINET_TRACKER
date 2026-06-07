import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatusBreakdown } from '@/features/dashboard/components/StatusBreakdown';
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
import { computeDashboardKpis, pospName } from '@/shared/utils/crm-calculations';
import { fmtDate, fmtINR, fmtINRShort } from '@/shared/utils/formatters';
import { Colors } from '@/theme/colors';
import { Spacing } from '@/theme/spacing';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, isAdmin, logout } = useAuth();
  const { deals, posp, loading, error, refresh } = useCrm();
  const [refreshing, setRefreshing] = useState(false);

  const kpis = useMemo(() => computeDashboardKpis(deals, posp), [deals, posp]);

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
          actions={<Badge label={isAdmin ? 'Admin' : 'POSP'} variant="muted" />}
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

        <Card title="Recent Deals">
          {recent.length === 0 ? (
            <EmptyState message="No deals yet. Add your first deal from the Deals tab." />
          ) : (
            recent.map((d) => (
              <DealListItem key={d.id} deal={d} pospLabel={pospName(posp, d.pospId)} />
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
  kpiGrid: {
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
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
