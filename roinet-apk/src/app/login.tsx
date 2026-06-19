import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthShell } from '@/features/auth/components/AuthShell';
import { useAuth } from '@/core/providers/AuthProvider';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Colors } from '@/theme/colors';
import { Radius, Spacing } from '@/theme/spacing';
import { Typography } from '@/theme/typography';

type LoginRole = 'admin' | 'posp';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<LoginRole>('admin');
  const isAdmin = role === 'admin';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function switchRole(next: LoginRole) {
    if (next === role) return;
    setRole(next);
    setError(null);
  }

  function fillAdminDemoCredentials() {
    setEmail('admin@roinet.com');
    setPassword('Admin@1234');
    setError(null);
  }

  async function onSubmit() {
    setBusy(true);
    setError(null);
    try {
      await login({ email, password });
      router.replace('/(crm)/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <View style={styles.roleToggle} accessibilityRole="tablist">
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: isAdmin }}
          style={[styles.roleBtn, isAdmin && styles.roleBtnActive]}
          onPress={() => switchRole('admin')}>
          <Text style={[styles.roleText, isAdmin && styles.roleTextActive]}>Admin</Text>
        </Pressable>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: !isAdmin }}
          style={[styles.roleBtn, !isAdmin && styles.roleBtnActive]}
          onPress={() => switchRole('posp')}>
          <Text style={[styles.roleText, !isAdmin && styles.roleTextActive]}>POSP</Text>
        </Pressable>
      </View>

      <Text style={Typography.authTitle}>Login</Text>
      <Text style={styles.subtitle}>
        {isAdmin
          ? 'Sign in with your admin credentials to manage the CRM.'
          : 'Sign in with your POSP credentials to access your deals and renewals.'}
      </Text>

      <Input
        label="Email"
        value={email}
        onChangeText={(v) => {
          setEmail(v);
          if (error) setError(null);
        }}
        placeholder={isAdmin ? 'admin@roinet.com' : 'you@example.com'}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        hasError={Boolean(error)}
      />
      <Input
        label="Password"
        value={password}
        onChangeText={(v) => {
          setPassword(v);
          if (error) setError(null);
        }}
        placeholder="••••••••"
        secureTextEntry
        hasError={Boolean(error)}
      />

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Button
        title={busy ? 'Signing in…' : isAdmin ? 'Login as Admin' : 'Login as POSP'}
        onPress={onSubmit}
        disabled={busy || !email || !password}
      />

      <View style={styles.footnote}>
        {isAdmin ? (
          <>
            <Text style={styles.footnoteText}>Admin accounts are provisioned by your organization.</Text>
            <Pressable onPress={fillAdminDemoCredentials} style={styles.demoLink}>
              <Text style={styles.link}>Use demo credentials</Text>
            </Pressable>
          </>
        ) : (
          <Text style={styles.footnoteText}>
            Don&apos;t have a POSP account?{' '}
            <Link href="/signup" style={styles.link}>
              Create an account
            </Link>
          </Text>
        )}
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  roleToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: 4,
    gap: 4,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  roleBtnActive: {
    backgroundColor: Colors.card,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  roleTextActive: {
    color: Colors.primary,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  errorBox: {
    backgroundColor: Colors.errorBg,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
  },
  footnote: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footnoteText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  link: {
    color: Colors.primary,
    fontWeight: '600',
  },
  demoLink: {
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
  },
});
