import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PospListItem } from '@/features/posp/components/PospListItem';
import { useCrm } from '@/core/providers/CrmProvider';
import { Card } from '@/shared/components/Card';
import { EmptyState } from '@/shared/components/EmptyState';
import { LoadingState } from '@/shared/components/LoadingState';
import { Colors } from '@/theme/colors';
import { Spacing } from '@/theme/spacing';

export default function PospScreen() {
  const { deals, posp, loading, refresh } = useCrm();
  const [refreshing, setRefreshing] = useState(false);

  const rows = useMemo(
    () =>
      posp.map((p) => {
        const myDeals = deals.filter((d) => d.pospId === p.id);
        const premium = myDeals.reduce((a, d) => a + (+d.premium || 0), 0);
        return { posp: p, dealCount: myDeals.length, premium };
      }),
    [deals, posp],
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
        <Card>
          {rows.length === 0 ? (
            <EmptyState message="No POSP agents found." />
          ) : (
            rows.map((row) => (
              <PospListItem
                key={row.posp.id}
                posp={row.posp}
                dealCount={row.dealCount}
                premium={row.premium}
              />
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
