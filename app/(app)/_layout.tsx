import { Stack } from 'expo-router';
import { useSession } from '@/contexts/SessionContext';
import { GroupProvider } from '@/contexts/GroupContext';

export default function AppLayout() {
  const session = useSession();
  if (!session) return null;

  return (
    <GroupProvider session={session}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="groups" />
        <Stack.Screen name="index" options={{ headerShown: true, headerTintColor: '#6C63FF' }} />
        <Stack.Screen name="welcome" options={{ presentation: 'modal', headerShown: true, title: 'Add Group', headerTintColor: '#6C63FF' }} />
        <Stack.Screen name="add-event" options={{ presentation: 'modal', headerShown: true, title: 'Add Event', headerTintColor: '#6C63FF' }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal', headerShown: true, title: 'Settings', headerTintColor: '#6C63FF' }} />
        <Stack.Screen name="setup-name" options={{ presentation: 'modal', headerShown: false, gestureEnabled: false }} />
      </Stack>
    </GroupProvider>
  );
}
