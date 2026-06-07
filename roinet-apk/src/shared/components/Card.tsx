import { type ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewProps } from 'react-native';

import { Colors } from '@/theme/colors';
import { Radius, Spacing } from '@/theme/spacing';
import { Typography } from '@/theme/typography';

interface CardProps extends ViewProps {
  title?: string;
  action?: ReactNode;
}

export function Card({ title, action, children, style, ...rest }: CardProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {title ? (
        <View style={styles.header}>
          <Text style={Typography.cardTitle}>{title}</Text>
          {action}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
});
