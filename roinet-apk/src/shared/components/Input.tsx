import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Colors } from '@/theme/colors';
import { Radius, Spacing } from '@/theme/spacing';
import { Typography } from '@/theme/typography';

interface InputProps extends TextInputProps {
  label: string;
  hasError?: boolean;
}

export function Input({ label, hasError, style, ...rest }: InputProps) {
  return (
    <View style={styles.group}>
      <Text style={Typography.label}>{label}</Text>
      <TextInput
        style={[styles.input, hasError && styles.inputError, style]}
        placeholderTextColor={Colors.textMuted}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: Spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingVertical: 9,
    paddingHorizontal: 11,
    fontSize: 13,
    color: Colors.text,
    backgroundColor: Colors.card,
  },
  inputError: {
    borderColor: '#f04438',
  },
});
