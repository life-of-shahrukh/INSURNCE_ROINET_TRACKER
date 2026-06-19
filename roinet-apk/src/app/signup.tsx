import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthShell } from '@/features/auth/components/AuthShell';
import { useAuth } from '@/core/providers/AuthProvider';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Colors } from '@/theme/colors';
import { Radius, Spacing } from '@/theme/spacing';
import { Typography } from '@/theme/typography';

export default function SignupScreen() {
  const { signupPosp } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    setBusy(true);
    setError(null);
    try {
      await signupPosp({
        name,
        code,
        mobile,
        email,
        joined: new Date().toISOString().slice(0, 10),
        active: true,
        password,
      });
      router.replace('/(crm)/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setBusy(false);
    }
  }

  const canSubmit = name && code && mobile && email && password;

  return (
    <AuthShell>
      <Text style={Typography.authTitle}>POSP Sign Up</Text>
      <Text style={styles.subtitle}>Create your POSP account to start tracking deals.</Text>

      <Input label="Full Name" value={name} onChangeText={setName} placeholder="Anjali Sharma" />
      <Input label="POSP Code" value={code} onChangeText={setCode} placeholder="POSP-1001" autoCapitalize="characters" />
      <Input label="Mobile" value={mobile} onChangeText={setMobile} placeholder="9876543210" keyboardType="phone-pad" />
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Input label="Password" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Button title={busy ? 'Creating account…' : 'Create POSP Account'} onPress={onSubmit} disabled={busy || !canSubmit} />

      <Text style={styles.footnote}>
        Already have an account?{' '}
        <Link href="/login" style={styles.link}>
          Login
        </Link>
      </Text>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
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
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  link: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
