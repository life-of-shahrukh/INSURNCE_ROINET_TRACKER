import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/theme/colors';
import { Radius, Spacing } from '@/theme/spacing';

export interface BarChartItem {
  key: string;
  label: string;
  value: number;
  displayValue?: string;
  color?: string;
}

interface BarChartProps {
  items: BarChartItem[];
  emptyMessage?: string;
  barColor?: string;
  chartHeight?: number;
  minColumnWidth?: number;
  valueHeight?: number;
  labelHeight?: number;
}

const DEFAULT_CHART_HEIGHT = 120;
const DEFAULT_MIN_COLUMN_WIDTH = 52;
const VALUE_ROW_HEIGHT = 18;
const LABEL_ROW_HEIGHT = 34;

export function BarChart({
  items,
  emptyMessage = 'No data to chart yet.',
  barColor = Colors.primaryLight,
  chartHeight = DEFAULT_CHART_HEIGHT,
  minColumnWidth = DEFAULT_MIN_COLUMN_WIDTH,
  valueHeight = VALUE_ROW_HEIGHT,
  labelHeight = LABEL_ROW_HEIGHT,
}: BarChartProps): React.ReactElement {
  if (items.length === 0) {
    return <Text style={styles.empty}>{emptyMessage}</Text>;
  }

  const screenWidth = Dimensions.get('window').width;
  const availableWidth = screenWidth - Spacing.xxl * 2 - Spacing.xl * 2;
  const neededWidth = items.length * minColumnWidth;
  const shouldScroll = neededWidth > availableWidth;
  const columnWidth = shouldScroll ? minColumnWidth : Math.floor(availableWidth / items.length);
  const contentWidth = shouldScroll ? neededWidth : availableWidth;
  const max = Math.max(...items.map((item) => item.value), 1);

  const chartBody = (
    <View style={[styles.row, { width: contentWidth }]}>
      {items.map((item) => {
        const barHeight = Math.max(8, (item.value / max) * chartHeight);
        const fillColor = item.color ?? barColor;

        return (
          <View key={item.key} style={[styles.column, { width: columnWidth }]}>
            <View style={[styles.valueRow, { height: valueHeight }]}>
              {item.displayValue ? (
                <Text style={styles.valueText} numberOfLines={1}>
                  {item.displayValue}
                </Text>
              ) : null}
            </View>

            <View style={[styles.barTrack, { height: chartHeight }]}>
              <View
                style={[
                  styles.barFill,
                  {
                    height: barHeight,
                    backgroundColor: fillColor,
                  },
                ]}
              />
            </View>

            <View style={[styles.labelRow, { minHeight: labelHeight }]}>
              <Text style={styles.labelText} numberOfLines={2}>
                {item.label}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );

  if (shouldScroll) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={false}>
        {chartBody}
      </ScrollView>
    );
  }

  return <View style={styles.staticWrap}>{chartBody}</View>;
}

const styles = StyleSheet.create({
  empty: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  staticWrap: {
    width: '100%',
  },
  scrollContent: {
    paddingRight: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  column: {
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  valueRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  valueText: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.textMuted,
    textAlign: 'center',
  },
  barTrack: {
    width: '72%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    width: '100%',
    borderTopLeftRadius: Radius.sm,
    borderTopRightRadius: Radius.sm,
    minHeight: 8,
  },
  labelRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 6,
  },
  labelText: {
    fontSize: 10,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 13,
  },
});
