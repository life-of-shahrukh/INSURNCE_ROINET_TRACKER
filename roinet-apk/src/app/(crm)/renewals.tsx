import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RenewalListItem } from '@/features/renewals/components/RenewalListItem';
import { useCrm } from '@/core/providers/CrmProvider';
import { Card } from '@/shared/components/Card';
import { EmptyState } from '@/shared/components/EmptyState';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageHeader } from '@/shared/components/PageHeader';
import { computeRenewals, pospName } from '@/shared/utils/crm-calculations';
import { Colors } from '@/theme/colors';
import { Spacing } from '@/theme/spacing';

export default function RenewalsScreen() {
  const { deals, posp, loading, refresh } = useCrm();
  const [refreshing, setRefreshing] = useState(false);
  const upcoming = useMemo(() => computeRenewals(deals), [deals]);

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
          title="Renewals"
          subtitle="Policies due within next 90 days (from issuance date)"
        />

        <Card>
          {upcoming.length === 0 ? (
            <EmptyState message="No renewals in the next 90 days. Mark a deal as issued to see it here." />
          ) : (
            upcoming.map((d) => (
              <RenewalListItem key={d.id} row={d} pospLabel={pospName(posp, d.pospId)} />
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
});
