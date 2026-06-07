import { StyleSheet, Text, View } from 'react-native';

import type { Deal } from '@/shared/types/crm.types';
import { computeOpenPipelineByPolicy } from '@/shared/utils/crm-calculations';
import { fmtINRShort } from '@/shared/utils/formatters';
import { Colors } from '@/theme/colors';
import { Radius, Spacing } from '@/theme/spacing';

interface OpenPipelineChartProps {
  deals: Deal[];
}

const CHART_HEIGHT = 130;

export function OpenPipelineChart({ deals }: OpenPipelineChartProps) {
  const items = computeOpenPipelineByPolicy(deals);
  const max = Math.max(...items.map((i) => i.value), 1);

  if (items.length === 0) {
    return <Text style={styles.empty}>No open deals in pipeline.</Text>;
  }

  return (
    <View style={[styles.chart, { height: CHART_HEIGHT }]}>
      {items.map((item) => {
        const barHeight = Math.max(8, (item.value / max) * CHART_HEIGHT);
        return (
          <View key={item.label} style={styles.column}>
            <Text style={styles.value}>{fmtINRShort(item.value)}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { height: barHeight }]} />
            </View>
            <Text style={styles.label} numberOfLines={2}>
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    minWidth: 48,
  },
  value: {
    fontSize: 9,
    color: Colors.textMuted,
    marginBottom: 4,
    textAlign: 'center',
  },
  barTrack: {
    width: '75%',
    height: CHART_HEIGHT,
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#0f4c75',
    borderTopLeftRadius: Radius.sm,
    borderTopRightRadius: Radius.sm,
    minHeight: 8,
  },
  label: {
    fontSize: 10,
    color: Colors.text,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 13,
  },
});
