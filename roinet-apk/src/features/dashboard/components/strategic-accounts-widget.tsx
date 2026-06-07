import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/shared/components/Badge';
import type { StrategicAccount } from '@/shared/types/crm.types';
import { isUpdateStale, strategicByBand } from '@/shared/utils/crm-calculations';
import { fmtDate, fmtINR } from '@/shared/utils/formatters';
import { Colors } from '@/theme/colors';
import { Spacing } from '@/theme/spacing';

interface StrategicAccountsWidgetProps {
  accounts: StrategicAccount[];
}

const BAND_LABELS: Record<string, string> = {
  week: 'This Week',
  month: 'This Month',
  quarter: 'This Quarter',
};

export function StrategicAccountsWidget({ accounts }: StrategicAccountsWidgetProps) {
  const grouped = strategicByBand(accounts);
  const bands = ['week', 'month', 'quarter'] as const;

  if (accounts.length === 0) {
    return <Text style={styles.empty}>No strategic accounts tracked.</Text>;
  }

  return (
    <View style={styles.wrap}>
      {bands.map((band) => {
        const items = grouped[band] ?? [];
        return (
          <View key={band} style={styles.bandSection}>
            <Text style={styles.bandTitle}>
              {BAND_LABELS[band]} — {items.length} account{items.length === 1 ? '' : 's'}
            </Text>
            {items.length === 0 ? (
              <Text style={styles.emptyBand}>No accounts in this timeframe.</Text>
            ) : (
              items.map((account) => {
                const stale = isUpdateStale(account.updatedOn);
                return (
                  <View key={account.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.accountName}>{account.name}</Text>
                      <Badge label={account.stage} variant={account.stage === 'issued' ? 'success' : 'muted'} />
                    </View>
                    <Text style={styles.meta}>
                      {account.owner || '–'} · {account.source || '–'}
                    </Text>
                    <Text style={styles.value}>{fmtINR(account.value)}</Text>
                    <Text style={styles.meta}>Expected {fmtDate(account.expected)}</Text>
                    <Text style={styles.update}>{account.update || 'No update yet'}</Text>
                    <Badge
                      label={account.updatedOn ? fmtDate(account.updatedOn) : 'No update'}
                      variant={stale ? 'hot' : 'success'}
                    />
                  </View>
                );
              })
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.lg,
  },
  empty: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  bandSection: {
    gap: Spacing.sm,
  },
  bandTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    backgroundColor: '#eef4f9',
    padding: Spacing.sm,
    borderRadius: 4,
  },
  emptyBand: {
    fontSize: 12,
    color: Colors.textMuted,
    paddingVertical: Spacing.sm,
  },
  card: {
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  accountName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  meta: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  update: {
    fontSize: 12,
    color: Colors.text,
    lineHeight: 18,
    marginTop: 4,
  },
});
