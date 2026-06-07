import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/theme/colors';
import { Radius, Spacing } from '@/theme/spacing';
import { Typography } from '@/theme/typography';

type KpiVariant = '' | 'hot' | 'warm' | 'success';

interface KpiCardProps {
  label: string;
  value: string;
  sub: string;
  variant?: KpiVariant;
}

const borderColors: Record<KpiVariant, string> = {
  '': Colors.primaryLight,
  hot: Colors.hot,
  warm: Colors.warm,
  success: Colors.success,
};

export function KpiCard({ label, value, sub, variant = '' }: KpiCardProps) {
  return (
    <View style={[styles.card, { borderLeftColor: borderColors[variant] }]}>
      <Text style={Typography.kpiLabel}>{label}</Text>
      <Text style={Typography.kpiValue}>{value}</Text>
      <Text style={Typography.kpiSub}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
    backgroundColor: Colors.card,
    paddingVertical: 18,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md,
    borderLeftWidth: 3,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
});
