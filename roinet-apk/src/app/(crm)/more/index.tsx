import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/core/providers/AuthProvider';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { PageHeader } from '@/shared/components/PageHeader';
import { Colors } from '@/theme/colors';
import { Radius, Spacing } from '@/theme/spacing';

const MENU_ITEMS = [
  { href: '/(crm)/more/posp' as const, icon: '◉', label: 'POSP Roster', sub: 'View and manage POSP agents' },
  { href: '/(crm)/more/commissions' as const, icon: '₹', label: 'Commissions', sub: 'Premium, COA and margin by POSP' },
  { href: '/(crm)/more/reports' as const, icon: '▦', label: 'Reports', sub: 'Policy-level analytics' },
] as const;

export default function MoreMenuScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="More" subtitle="Admin tools and account" />

        <Card>
          <Text style={styles.accountLabel}>Signed in as</Text>
          <Text style={styles.accountEmail}>{user?.email}</Text>
          <Text style={styles.accountRole}>{user?.role === 'ADMIN' ? 'Administrator' : 'POSP Agent'}</Text>
        </Card>

        {MENU_ITEMS.map((item) => (
          <Pressable
            key={item.href}
            style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            onPress={() => router.push(item.href)}>
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <View style={styles.menuText}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuSub}>{item.sub}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}

        <View style={styles.logoutWrap}>
          <Button title="Logout" variant="secondary" onPress={handleLogout} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    padding: Spacing.xxl,
    paddingBottom: Spacing.xxxl,
  },
  accountLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  accountEmail: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 4,
  },
  accountRole: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  menuItemPressed: {
    opacity: 0.9,
  },
  menuIcon: {
    fontSize: 18,
    color: Colors.primary,
    width: 24,
    textAlign: 'center',
  },
  menuText: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  menuSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    color: Colors.textMuted,
  },
  logoutWrap: {
    marginTop: Spacing.xxl,
  },
});
