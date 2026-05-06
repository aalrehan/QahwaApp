import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  display_name_ar: string;
  bio: string | null;
  avatar_url: string | null;
  city: string;
  total_logs: number;
  total_followers: number;
  total_following: number;
  created_at: string;
};

type ProfileState = {
  profile: Profile | null;
  loading: boolean;
  refetch: () => Promise<void>;
};

export function useProfile(userId: string | null | undefined): ProfileState {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetch() {
    if (!userId) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    setProfile(data ?? null);
    setLoading(false);
  }

  useEffect(() => {
    setLoading(true);
    fetch();

    if (!userId) return;

    const channel = supabase
      .channel(`profile:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        () => { fetch(); },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return { profile, loading, refetch: fetch };
}

export async function createProfile(data: {
  id: string;
  username: string;
  display_name_ar: string;
  display_name?: string | null;
  city: string;
}) {
  const { error } = await supabase.from('profiles').insert(data);
  if (error) throw error;
}

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle();
  if (error) throw error;
  return data === null;
}
