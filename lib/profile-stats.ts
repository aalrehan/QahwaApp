import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export type RecentLog = {
  id: string;
  drink_name: string;
  overall_rating: number;
  created_at: string;
  cafe: { name_ar: string } | null;
};

export type EarnedBadge = {
  badge_id: string;
  earned_at: string;
  badge: {
    id: string;
    name_ar: string;
    icon: string | null;
  } | null;
};

type ProfileStats = {
  totalLogs: number;
  avgRating: number | null; // null when totalLogs === 0
  uniqueCafes: number;
  recentLogs: RecentLog[];
  badges: EarnedBadge[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

const INITIAL: Omit<ProfileStats, 'refetch'> = {
  totalLogs: 0,
  avgRating: null,
  uniqueCafes: 0,
  recentLogs: [],
  badges: [],
  loading: true,
  error: null,
};

export function useProfileStats(userId: string | null | undefined): ProfileStats {
  const [state, setState] = useState<Omit<ProfileStats, 'refetch'>>(INITIAL);

  const load = useCallback(async () => {
    if (!userId) {
      setState({ ...INITIAL, loading: false });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));

    // Three independent queries run in parallel.
    const statsPromise = supabase
      .from('coffee_logs')
      .select('overall_rating, cafe_id')
      .eq('user_id', userId);

    const recentPromise = supabase
      .from('coffee_logs')
      .select('id, drink_name, overall_rating, created_at, cafe:cafes(name_ar)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);

    // Badges table may not exist or be empty yet — guard with try/catch.
    const badgesPromise = supabase
      .from('user_badges')
      .select('badge_id, earned_at, badge:badges(id, name_ar, icon)')
      .eq('user_id', userId);

    try {
      const [statsRes, recentRes, badgesRes] = await Promise.all([
        statsPromise,
        recentPromise,
        badgesPromise.then(
          (r) => r,
          () => ({ data: null, error: { message: 'badges unavailable' } }),
        ),
      ]);

      if (statsRes.error) throw statsRes.error;

      const rows = (statsRes.data ?? []) as { overall_rating: number; cafe_id: string | null }[];
      const totalLogs = rows.length;
      const avgRating =
        totalLogs > 0
          ? rows.reduce((sum, r) => sum + (r.overall_rating ?? 0), 0) / totalLogs
          : null;
      const uniqueCafes = new Set(
        rows.filter((r) => r.cafe_id).map((r) => r.cafe_id as string),
      ).size;

      const recentLogs = (recentRes.data ?? []) as unknown as RecentLog[];
      // Badges query is non-fatal; if it errored, treat as empty.
      const badges = badgesRes.error ? [] : ((badgesRes.data ?? []) as unknown as EarnedBadge[]);

      setState({
        totalLogs,
        avgRating,
        uniqueCafes,
        recentLogs,
        badges,
        loading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState((s) => ({ ...s, loading: false, error: message }));
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, refetch: load };
}
