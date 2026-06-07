import { Stack } from 'expo-router';

import { Colors } from '@/theme/colors';

export default function MoreStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: Colors.bg },
      }}>
      <Stack.Screen name="index" options={{ title: 'More' }} />
      <Stack.Screen name="posp" options={{ title: 'POSP Roster' }} />
      <Stack.Screen name="commissions" options={{ title: 'Commissions' }} />
      <Stack.Screen name="reports" options={{ title: 'Reports' }} />
    </Stack>
  );
}
