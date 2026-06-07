import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/shared/components/Badge';
import type { Deal } from '@/shared/types/crm.types';
import { fmtDate, fmtINR } from '@/shared/utils/formatters';
import { Colors } from '@/theme/colors';
import { Radius, Spacing } from '@/theme/spacing';

interface DealListItemProps {
  deal: Deal;
  pospLabel: string;
  onPress?: () => void;
}

const statusBorder: Record<Deal['status'], string> = {
  H: Colors.hot,
  W: Colors.warm,
  C: Colors.cold,
};

export function DealListItem({ deal, pospLabel, onPress }: DealListItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { borderLeftColor: statusBorder[deal.status] }, pressed && styles.pressed]}>
      <View style={styles.header}>
        <Text style={styles.customer}>{deal.customer}</Text>
        <Badge status={deal.status} />
      </View>
      <Text style={styles.meta}>
        {deal.policy} · {pospLabel}
      </Text>
      <View style={styles.row}>
        <View>
          <Text style={styles.statLabel}>Premium</Text>
          <Text style={styles.statValue}>{fmtINR(deal.premium)}</Text>
        </View>
        <View>
          <Text style={styles.statLabel}>Expected</Text>
          <Text style={styles.statValue}>{fmtDate(deal.expected)}</Text>
        </View>
        <View>
          <Text style={styles.statLabel}>Margin</Text>
          <Text style={styles.statValue}>{fmtINR(deal.margin)}</Text>
        </View>
      </View>
      {deal.remarks ? <Text style={styles.remarks} numberOfLines={2}>{deal.remarks}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 3,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  pressed: {
    opacity: 0.9,
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
  remarks: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
});
