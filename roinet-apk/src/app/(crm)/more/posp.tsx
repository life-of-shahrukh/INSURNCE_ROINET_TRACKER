import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PospFormModal } from '@/features/posp/components/posp-form-modal';
import { PospListItem } from '@/features/posp/components/PospListItem';
import { useCrm } from '@/core/providers/CrmProvider';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { EmptyState } from '@/shared/components/EmptyState';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageHeader } from '@/shared/components/PageHeader';
import type { Posp } from '@/shared/types/crm.types';
import { Colors } from '@/theme/colors';
import { Spacing } from '@/theme/spacing';

export default function PospScreen() {
  const { allDeals, posp, loading, refresh } = useCrm();
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPosp, setEditPosp] = useState<Posp | null>(null);

  const rows = useMemo(
    () =>
      posp.map((p) => {
        const myDeals = allDeals.filter((d) => d.pospId === p.id);
        const premium = myDeals.reduce((a, d) => a + (+d.premium || 0), 0);
        return { posp: p, dealCount: myDeals.length, premium };
      }),
    [allDeals, posp],
  );

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  function openNew() {
    setEditPosp(null);
    setModalOpen(true);
  }

  function openEdit(item: Posp) {
    setEditPosp(item);
    setModalOpen(true);
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
          title="POSP Roster"
          subtitle="Active and inactive Point of Sales Persons"
          actions={<Button title="+ Add POSP" onPress={openNew} />}
        />

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
                onPress={() => openEdit(row.posp)}
              />
            ))
          )}
        </Card>
      </ScrollView>

      <PospFormModal visible={modalOpen} pospItem={editPosp} onClose={() => setModalOpen(false)} />
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
