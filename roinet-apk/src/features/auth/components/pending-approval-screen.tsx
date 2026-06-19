import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/core/providers/AuthProvider';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { Button } from '@/shared/components/Button';
import { Colors } from '@/theme/colors';
import { Spacing } from '@/theme/spacing';
import { Typography } from '@/theme/typography';

export function PendingApprovalScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <AuthShell>
      <Text style={Typography.authTitle}>Account Pending Approval</Text>
      <Text style={styles.subtitle}>
        Your POSP signup for {user?.email ?? 'your account'} is complete. Please wait for admin approval before
        accessing the CRM.
      </Text>
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>An administrator will activate your account in the POSP roster.</Text>
      </View>
      <Button title="Back to Login" variant="secondary" onPress={() => void handleLogout()} />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: Colors.mutedBg,
    borderRadius: 8,
    padding: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  infoText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
  },
});
