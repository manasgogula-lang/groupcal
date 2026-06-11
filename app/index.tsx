import { Redirect } from 'expo-router';
import { useSession } from '@/contexts/SessionContext';

export default function Index() {
  const session = useSession();
  return session ? <Redirect href="/(app)/groups" /> : <Redirect href="/(auth)/login" />;
}
