import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/shared/components/Badge';
import type { RenewalRow } from '@/shared/utils/crm-calculations';
import { fmtDate, fmtINR } from '@/shared/utils/formatters';
import { Colors } from '@/theme/colors';
import { Radius, Spacing } from '@/theme/spacing';

interface RenewalListItemProps {
  row: RenewalRow;
  pospLabel: string;
}

export function RenewalListItem({ row, pospLabel }: RenewalListItemProps) {
  const daysVariant =
    row.daysLeft < 0 ? 'hot' : row.daysLeft < 30 ? 'warm' : 'cold';
  const daysLabel =
    row.daysLeft < 0
      ? `Overdue ${Math.abs(row.daysLeft)}d`
      : `${row.daysLeft} days`;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.customer}>{row.customer}</Text>
        <Badge label={daysLabel} variant={daysVariant} />
      </View>
      <Text style={styles.meta}>
        {row.policyNo} · {row.policy}
      </Text>
      <View style={styles.row}>
        <View>
          <Text style={styles.statLabel}>Premium</Text>
          <Text style={styles.statValue}>{fmtINR(row.premium)}</Text>
        </View>
        <View>
          <Text style={styles.statLabel}>POSP</Text>
          <Text style={styles.statValueSmall}>{pospLabel}</Text>
        </View>
        <View>
          <Text style={styles.statLabel}>Renewal</Text>
          <Text style={styles.statValueSmall}>{fmtDate(row.renew)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primaryLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  customer: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  meta: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 2,
  },
  statValueSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 2,
  },
});
