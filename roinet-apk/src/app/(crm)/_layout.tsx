import { Redirect, Tabs } from 'expo-router';

import { PendingApprovalScreen } from '@/features/auth/components/pending-approval-screen';
import { LoadingState } from '@/shared/components/LoadingState';
import {
  dashboardTabIcon,
  dealsTabIcon,
  leadsTabIcon,
  moreTabIcon,
  renewalsTabIcon,
} from '@/shared/components/tab-bar-icon';
import { useAuth } from '@/core/providers/AuthProvider';
import { Colors } from '@/theme/colors';

export default function CrmTabLayout() {
  const { user, initializing, isAdmin } = useAuth();

  if (initializing) {
    return <LoadingState />;
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (user.status === 'PENDING') {
    return <PendingApprovalScreen />;
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '600', fontSize: 16 },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.border,
        },
        sceneStyle: { backgroundColor: Colors.bg },
      }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          headerTitle: 'Roinet Insurance',
          headerRight: () => null,
          tabBarIcon: dashboardTabIcon,
        }}
      />
      <Tabs.Screen
        name="leads"
        options={{
          title: 'Leads',
          tabBarLabel: 'Leads',
          href: isAdmin ? undefined : null,
          tabBarIcon: leadsTabIcon,
        }}
      />
      <Tabs.Screen
        name="deals"
        options={{
          title: 'Deals',
          tabBarLabel: 'Deals',
          href: isAdmin ? undefined : null,
          tabBarIcon: dealsTabIcon,
        }}
      />
      <Tabs.Screen
        name="renewals"
        options={{
          title: 'Renewals',
          tabBarLabel: 'Renewals',
          tabBarIcon: renewalsTabIcon,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarLabel: 'More',
          headerShown: false,
          href: isAdmin ? undefined : null,
          tabBarIcon: moreTabIcon,
        }}
      />
    </Tabs>
  );
}
