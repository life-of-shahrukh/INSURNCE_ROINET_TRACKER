import { StyleSheet, Text, View } from 'react-native';

import { computeRenewals } from '@/shared/utils/crm-calculations';
import type { Deal } from '@/shared/types/crm.types';
import { Colors } from '@/theme/colors';
import { Radius, Spacing } from '@/theme/spacing';

interface RenewalsWidgetProps {
  deals: Deal[];
}

export function RenewalsWidget({ deals }: RenewalsWidgetProps) {
  const upcoming = computeRenewals(deals);
  const overdue = upcoming.filter((d) => d.daysLeft < 0).length;
  const urgent = upcoming.filter((d) => d.daysLeft >= 0 && d.daysLeft < 30).length;
  const later = upcoming.filter((d) => d.daysLeft >= 30).length;

  return (
    <View style={styles.wrap}>
      <View style={styles.statRow}>
        <View style={[styles.statBox, styles.statOverdue]}>
          <Text style={styles.statValue}>{overdue}</Text>
          <Text style={styles.statLabel}>Overdue</Text>
        </View>
        <View style={[styles.statBox, styles.statUrgent]}>
          <Text style={styles.statValue}>{urgent}</Text>
          <Text style={styles.statLabel}>Due in 30d</Text>
        </View>
        <View style={[styles.statBox, styles.statLater]}>
          <Text style={styles.statValue}>{later}</Text>
          <Text style={styles.statLabel}>31–90 days</Text>
        </View>
      </View>
      <Text style={styles.hint}>
        {upcoming.length === 0
          ? 'No renewals in the next 90 days.'
          : `${upcoming.length} policies need renewal attention.`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statBox: {
    flex: 1,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
  },
  statOverdue: {
    backgroundColor: Colors.hotBg,
  },
  statUrgent: {
    backgroundColor: Colors.warmBg,
  },
  statLater: {
    backgroundColor: Colors.coldBg,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  hint: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
