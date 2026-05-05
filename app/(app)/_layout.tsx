import { Redirect, Stack } from 'expo-router';

import { useSession } from '@/lib/auth';

export default function AppLayout() {
  const { session, loading } = useSession();

  if (loading) {
    return null;
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
