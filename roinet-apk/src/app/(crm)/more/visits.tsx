import { useMemo, useState } from 'react';
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCrm } from '@/core/providers/CrmProvider';
import { Card } from '@/shared/components/Card';
import { EmptyState } from '@/shared/components/EmptyState';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageHeader } from '@/shared/components/PageHeader';
import { pospName } from '@/shared/utils/crm-calculations';
import { fmtDate } from '@/shared/utils/formatters';
import { Colors } from '@/theme/colors';
import { Spacing } from '@/theme/spacing';

export default function VisitsScreen() {
  const { visits, posp, loading, refresh } = useCrm();
  const [refreshing, setRefreshing] = useState(false);

  const summary = useMemo(() => {
    const byPerson: Record<string, { visits: number; posps: Set<string> }> = {};
    visits.forEach((visit) => {
      if (!byPerson[visit.person]) {
        byPerson[visit.person] = { visits: 0, posps: new Set() };
      }
      byPerson[visit.person].visits++;
      byPerson[visit.person].posps.add(visit.pospId);
    });
    return Object.entries(byPerson)
      .map(([person, data]) => ({ person, visits: data.visits, distinctPosps: data.posps.size }))
      .sort((a, b) => a.person.localeCompare(b.person));
  }, [visits]);

  const log = useMemo(
    () => [...visits].sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    [visits],
  );

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  function openMap(lat: number, lng: number) {
    void Linking.openURL(`https://www.google.com/maps?q=${lat},${lng}`);
  }

  if (loading && !refreshing) {
    return <LoadingState />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}>
        <PageHeader title="Field Visits" subtitle="Partner meetings and GPS punch-ins" />

        <Card title="Summary by Sales Person">
          {summary.length === 0 ? (
            <EmptyState message="No visits logged yet." />
          ) : (
            summary.map((row) => (
              <View key={row.person} style={styles.summaryRow}>
                <Text style={styles.person}>{row.person}</Text>
                <Text style={styles.summaryStat}>{row.visits} visits</Text>
                <Text style={styles.summaryStat}>{row.distinctPosps} POSPs met</Text>
              </View>
            ))
          )}
        </Card>

        <Card title="Visit Log">
          {log.length === 0 ? (
            <EmptyState message="No visits logged yet." />
          ) : (
            log.map((visit) => (
              <View key={visit.id} style={styles.logRow}>
                <Text style={styles.logDate}>{fmtDate(visit.date)}</Text>
                <Text style={styles.person}>{visit.person}</Text>
                <Text style={styles.meta}>Met {pospName(posp, visit.pospId)}</Text>
                {visit.lat != null && visit.lng != null ? (
                  <Pressable onPress={() => openMap(visit.lat, visit.lng)}>
                    <Text style={styles.mapLink}>
                      {visit.lat.toFixed(4)}, {visit.lng.toFixed(4)} · Open map
                    </Text>
                  </Pressable>
                ) : (
                  <Text style={styles.meta}>Location not captured</Text>
                )}
                {visit.notes ? <Text style={styles.notes}>{visit.notes}</Text> : null}
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
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  person: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    minWidth: 120,
  },
  summaryStat: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  logRow: {
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    gap: 4,
  },
  logDate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  meta: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  mapLink: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  notes: {
    fontSize: 12,
    color: Colors.text,
    lineHeight: 18,
    marginTop: 4,
  },
});
