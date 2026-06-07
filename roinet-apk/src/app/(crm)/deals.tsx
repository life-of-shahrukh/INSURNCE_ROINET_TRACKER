import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DealListItem } from '@/features/deals/components/DealListItem';
import { useCrm } from '@/core/providers/CrmProvider';
import { Card } from '@/shared/components/Card';
import { EmptyState } from '@/shared/components/EmptyState';
import { FilterChips } from '@/shared/components/FilterChips';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageHeader } from '@/shared/components/PageHeader';
import { pospName } from '@/shared/utils/crm-calculations';
import { Colors } from '@/theme/colors';
import { Radius, Spacing } from '@/theme/spacing';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'H', label: 'Hot' },
  { value: 'W', label: 'Warm' },
  { value: 'C', label: 'Cold' },
];

export default function DealsScreen() {
  const { deals, posp, loading, refresh } = useCrm();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const rows = useMemo(() => {
    let list = deals;
    if (filter !== 'all') list = list.filter((d) => d.status === filter);
    const q = search.toLowerCase();
    if (q) {
      list = list.filter(
        (d) =>
          (d.customer || '').toLowerCase().includes(q) ||
          pospName(posp, d.pospId).toLowerCase().includes(q) ||
          (d.policy || '').toLowerCase().includes(q) ||
          (d.proposal || '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [deals, posp, filter, search]);

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
          title="Deals Tracker"
          subtitle="Master list — POSP, customer, policy details, status"
        />

        <Card>
          <FilterChips options={FILTERS} value={filter} onChange={setFilter} />
          <TextInput
            style={styles.search}
            placeholder="Search customer, POSP, policy…"
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {rows.length === 0 ? (
            <EmptyState message="No deals match these filters." />
          ) : (
            rows.map((d) => (
              <DealListItem key={d.id} deal={d} pospLabel={pospName(posp, d.pospId)} />
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
  search: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingVertical: 9,
    paddingHorizontal: 11,
    fontSize: 13,
    color: Colors.text,
    backgroundColor: Colors.card,
    marginBottom: Spacing.lg,
  },
});
