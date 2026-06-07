import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCrm } from '@/core/providers/CrmProvider';
import { QUOTE_STATUS_LABELS } from '@/core/constants/crm-config';
import { Badge } from '@/shared/components/Badge';
import { Card } from '@/shared/components/Card';
import { EmptyState } from '@/shared/components/EmptyState';
import { KpiCard } from '@/shared/components/KpiCard';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageHeader } from '@/shared/components/PageHeader';
import type { QuoteLine, QuoteStatus } from '@/shared/types/crm.types';
import { fmtDate, fmtINR } from '@/shared/utils/formatters';
import { Colors } from '@/theme/colors';
import { Radius, Spacing } from '@/theme/spacing';

type QuoteFilter = 'all' | QuoteLine;

const FILTERS: Array<{ key: QuoteFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'life', label: 'Life' },
  { key: 'health', label: 'Health' },
  { key: 'motor', label: 'Motor' },
];

function statusVariant(status: QuoteStatus): 'warm' | 'success' | 'muted' {
  if (status === 'requested') return 'warm';
  if (status === 'closed') return 'success';
  return 'muted';
}

export default function QuotesScreen() {
  const { quotes, loading, refresh } = useCrm();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<QuoteFilter>('all');

  const rows = useMemo(
    () => (filter === 'all' ? quotes : quotes.filter((q) => q.line === filter)),
    [quotes, filter],
  );

  const kpis = useMemo(() => {
    const count = (status: QuoteStatus) => quotes.filter((q) => q.status === status).length;
    return {
      total: quotes.length,
      life: quotes.filter((q) => q.line === 'life').length,
      health: quotes.filter((q) => q.line === 'health').length,
      motor: quotes.filter((q) => q.line === 'motor').length,
      requested: count('requested'),
      quoteSent: count('quote_sent'),
      closed: count('closed'),
    };
  }, [quotes]);

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
        <PageHeader title="Quote Requests" subtitle="Underwriting quote pipeline" />

        <View style={styles.kpiRow}>
          <KpiCard
            label="Total Requests"
            value={String(kpis.total)}
            sub={`Life ${kpis.life} · Health ${kpis.health} · Motor ${kpis.motor}`}
          />
          <KpiCard label="Awaiting Quote" value={String(kpis.requested)} sub="With underwriting" variant="warm" />
        </View>
        <View style={styles.kpiRow}>
          <KpiCard label="Quote Sent" value={String(kpis.quoteSent)} sub="Back with sales" />
          <KpiCard label="Closed" value={String(kpis.closed)} sub="Completed" variant="success" />
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map((item) => (
            <Pressable
              key={item.key}
              style={[styles.chip, filter === item.key && styles.chipActive]}
              onPress={() => setFilter(item.key)}>
              <Text style={[styles.chipText, filter === item.key && styles.chipTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        <Card>
          {rows.length === 0 ? (
            <EmptyState message="No quote requests in this view." />
          ) : (
            rows.map((quote) => (
              <View key={quote.id} style={styles.row}>
                <View style={styles.rowHeader}>
                  <Text style={styles.customer}>{quote.customer}</Text>
                  <Badge label={QUOTE_STATUS_LABELS[quote.status] ?? quote.status} variant={statusVariant(quote.status)} />
                </View>
                <Text style={styles.meta}>
                  {quote.line.toUpperCase()} · {fmtINR(quote.sum)}
                </Text>
                <Text style={styles.meta}>
                  Requested by {quote.requestedBy || '–'} on {fmtDate(quote.requestedOn)}
                </Text>
                {quote.notes ? <Text style={styles.notes}>{quote.notes}</Text> : null}
              </View>
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
  kpiRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.mutedBg,
  },
  chipActive: {
    backgroundColor: Colors.primary,
  },
  chipText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  chipTextActive: {
    color: Colors.white,
  },
  row: {
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    gap: 4,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  customer: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  meta: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  notes: {
    fontSize: 12,
    color: Colors.text,
    lineHeight: 18,
    marginTop: 4,
  },
});
