import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/shared/components/Badge';
import type { Posp } from '@/shared/types/crm.types';
import { Colors } from '@/theme/colors';
import { Radius, Spacing } from '@/theme/spacing';

interface PospListItemProps {
  posp: Posp;
  dealCount: number;
  premium: number;
}

export function PospListItem({ posp, dealCount, premium }: PospListItemProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.name}>{posp.name}</Text>
          <Text style={styles.code}>{posp.code}</Text>
        </View>
        <Badge label={posp.active ? 'Active' : 'Inactive'} variant={posp.active ? 'success' : 'muted'} />
      </View>
      <Text style={styles.contact}>
        {posp.mobile} · {posp.email}
      </Text>
      <View style={styles.stats}>
        <View>
          <Text style={styles.statLabel}>Deals</Text>
          <Text style={styles.statValue}>{dealCount}</Text>
        </View>
        <View>
          <Text style={styles.statLabel}>Premium</Text>
          <Text style={styles.statValue}>₹{premium.toLocaleString('en-IN')}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  code: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  contact: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 2,
  },
});
