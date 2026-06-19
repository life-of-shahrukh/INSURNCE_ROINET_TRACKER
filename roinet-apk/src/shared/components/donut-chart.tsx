import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { Colors } from '@/theme/colors';
import { Spacing } from '@/theme/spacing';

export interface DonutSegment {
  value: number;
  color: string;
  label: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerSubLabel?: string;
}

export function DonutChart({
  segments,
  size = 168,
  strokeWidth = 22,
  centerLabel,
  centerSubLabel,
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  if (total === 0) {
    return null;
  }

  let cumulativeOffset = 0;

  return (
    <View style={styles.wrap}>
      <View style={[styles.chartBox, { width: size, height: size }]}>
        <Svg width={size} height={size}>
          <G rotation={-90} origin={`${center}, ${center}`}>
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={Colors.mutedBg}
              strokeWidth={strokeWidth}
              fill="none"
            />
            {segments.map((segment) => {
              if (segment.value <= 0) {
                return null;
              }
              const arcLength = (segment.value / total) * circumference;
              const dashOffset = cumulativeOffset;
              cumulativeOffset += arcLength;

              return (
                <Circle
                  key={segment.label}
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={segment.color}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={`${arcLength} ${circumference - arcLength}`}
                  strokeDashoffset={-dashOffset}
                  strokeLinecap="butt"
                />
              );
            })}
          </G>
        </Svg>
        <View style={styles.centerOverlay} pointerEvents="none">
          {centerLabel ? <Text style={styles.centerLabel}>{centerLabel}</Text> : null}
          {centerSubLabel ? <Text style={styles.centerSub}>{centerSubLabel}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  chartBox: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  centerLabel: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  centerSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
});
