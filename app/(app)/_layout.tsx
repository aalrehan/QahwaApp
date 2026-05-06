import { Redirect, Stack, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';

import { useSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function AppLayout() {
  const { session, loading: authLoading } = useSession();
  const [profileExists, setProfileExists] = useState<boolean | null>(null);
  const segments = useSegments();
  const isOnProfileSetup = segments.includes('profile-setup' as never);

  useEffect(() => {
    if (!session?.user.id) {
      setProfileExists(null);
      return;
    }

    supabase
      .from('profiles')
      .select('id')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => setProfileExists(data !== null));

    const channel = supabase
      .channel(`app-layout:${session.user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${session.user.id}`,
        },
        () => setProfileExists(true),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user.id]);

  if (authLoading || (session && profileExists === null)) {
    return null;
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!profileExists && !isOnProfileSetup) {
    return <Redirect href="/(app)/profile-setup" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="log" options={{ presentation: 'modal' }} />
      <Stack.Screen name="profile-setup" />
    </Stack>
  );
}
