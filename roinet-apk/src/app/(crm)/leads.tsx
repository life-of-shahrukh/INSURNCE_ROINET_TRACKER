import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DealFormModal } from '@/features/deals/components/deal-form-modal';
import { useCrm } from '@/core/providers/CrmProvider';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { EmptyState } from '@/shared/components/EmptyState';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageHeader } from '@/shared/components/PageHeader';
import { pospName } from '@/shared/utils/crm-calculations';
import { fmtDate, fmtINRShort } from '@/shared/utils/formatters';
import type { Deal, DealStatus } from '@/shared/types/crm.types';
import { Colors } from '@/theme/colors';
import { Radius, Spacing } from '@/theme/spacing';

const COLS: { key: DealStatus; label: string; color: string }[] = [
  { key: 'H', label: 'Hot', color: Colors.hot },
  { key: 'W', label: 'Warm', color: Colors.warm },
  { key: 'C', label: 'Cold', color: Colors.cold },
];

export default function LeadsScreen() {
  const { deals, posp, loading, refresh } = useCrm();
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editDeal, setEditDeal] = useState<Deal | null>(null);

  const byStatus = useMemo(() => {
    const map: Record<DealStatus, Deal[]> = { H: [], W: [], C: [] };
    deals.forEach((d) => map[d.status].push(d));
    return map;
  }, [deals]);

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  function openNew() {
    setEditDeal(null);
    setModalOpen(true);
  }

  function openEdit(deal: Deal) {
    setEditDeal(deal);
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
          title="Leads Pipeline"
          subtitle="Leads grouped by temperature — Hot, Warm, Cold"
          actions={<Button title="+ New Lead" onPress={openNew} />}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kanban}>
          {COLS.map((col) => (
            <View key={col.key} style={styles.column}>
              <View style={styles.colHeader}>
                <View style={[styles.colDot, { backgroundColor: col.color }]} />
                <Text style={styles.colTitle}>{col.label}</Text>
                <Text style={styles.colCount}>{byStatus[col.key].length}</Text>
              </View>
              {byStatus[col.key].length === 0 ? (
                <View style={styles.emptyCol}>
                  <Text style={styles.emptyText}>No leads</Text>
                </View>
              ) : (
                byStatus[col.key].map((d) => (
                  <Pressable
                    key={d.id}
                    onPress={() => openEdit(d)}
                    style={({ pressed }) => [styles.leadCard, { borderLeftColor: col.color }, pressed && styles.pressed]}>
                    <Text style={styles.leadName}>{d.customer}</Text>
                    <Text style={styles.leadMeta}>
                      {d.policy} · {fmtINRShort(d.premium)}
                    </Text>
                    <Text style={styles.leadMeta}>
                      POSP: {pospName(posp, d.pospId)} · {fmtDate(d.expected)}
                    </Text>
                  </Pressable>
                ))
              )}
            </View>
          ))}
        </ScrollView>

        {deals.length === 0 ? (
          <Card>
            <EmptyState message="No leads yet. Tap + New Lead to add your first deal." />
          </Card>
        ) : null}
      </ScrollView>

      <DealFormModal visible={modalOpen} deal={editDeal} onClose={() => setModalOpen(false)} />
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
  kanban: {
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  column: {
    width: 260,
    backgroundColor: Colors.mutedBg,
    borderRadius: Radius.md,
    padding: Spacing.md,
    minHeight: 200,
  },
  colHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  colDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
  },
  colTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  colCount: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    backgroundColor: Colors.card,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  emptyCol: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  leadCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 3,
  },
  pressed: {
    opacity: 0.9,
  },
  leadName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  leadMeta: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
});
