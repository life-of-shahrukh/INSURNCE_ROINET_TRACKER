import { StyleSheet, Text, View } from 'react-native';

import type { DealStatus } from '@/shared/types/crm.types';
import { statusLabel } from '@/shared/utils/formatters';
import { Colors } from '@/theme/colors';
import { Radius, Spacing } from '@/theme/spacing';
import { Typography } from '@/theme/typography';

type BadgeVariant = 'hot' | 'warm' | 'cold' | 'success' | 'muted';

interface BadgeProps {
  status?: DealStatus;
  label?: string;
  variant?: BadgeVariant;
}

function statusVariant(status: DealStatus): BadgeVariant {
  const map: Record<DealStatus, BadgeVariant> = { H: 'hot', W: 'warm', C: 'cold' };
  return map[status] ?? 'muted';
}

const variantStyles: Record<BadgeVariant, { bg: string; fg: string }> = {
  hot: { bg: Colors.hotBg, fg: Colors.hot },
  warm: { bg: Colors.warmBg, fg: '#c97a1c' },
  cold: { bg: Colors.coldBg, fg: Colors.cold },
  success: { bg: Colors.successBg, fg: Colors.success },
  muted: { bg: Colors.mutedBg, fg: Colors.textMuted },
};

export function Badge({ status, label, variant }: BadgeProps) {
  const resolvedVariant = variant ?? (status ? statusVariant(status) : 'muted');
  const colors = variantStyles[resolvedVariant];
  const text = label ?? (status ? statusLabel(status) : '');

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, Typography.badge, { color: colors.fg }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  text: {
    fontSize: 11,
  },
});
