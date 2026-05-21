import { useCallback, useEffect, useRef, useState } from 'react';

import { useSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { CoffeeLog, RawCoffeeLogRow } from '@/lib/types';

const PAGE_SIZE = 20;

const SELECT_QUERY = `
  *,
  cafe:cafes(id, name_ar, city),
  profile:profiles!user_id(username, display_name_ar, city),
  log_flavor_notes(
    flavor_note:flavor_notes(id, name_ar, color_hex, emoji, level)
  ),
  likes_count:likes(count)
`;

function flattenLog(raw: RawCoffeeLogRow): CoffeeLog {
  const { log_flavor_notes, likes_count, ...rest } = raw;
  const flavor_notes = (log_flavor_notes ?? [])
    .map((entry) => entry.flavor_note)
    .filter((n): n is NonNullable<typeof n> => !!n);
  // PostgREST returns aggregates as `[{ count: N }]`; flatten to a number.
  const count = Array.isArray(likes_count) ? likes_count[0]?.count ?? 0 : 0;
  return { ...rest, flavor_notes, likes_count: count };
}

export async function fetchUserLikedIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('likes')
    .select('log_id')
    .eq('user_id', userId);
  if (error) return new Set();
  return new Set((data ?? []).map((row) => row.log_id as string));
}

export type FeedMode = 'public' | 'self';

type UseFeedReturn = {
  logs: CoffeeLog[];
  likedLogIds: Set<string>;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  toggleLike: (logId: string, currentlyLiked: boolean) => Promise<void>;
};

export function useFeed({
  mode,
  excludeSelf = false,
}: {
  mode: FeedMode;
  excludeSelf?: boolean;
}): UseFeedReturn {
  const { user } = useSession();
  const [logs, setLogs] = useState<CoffeeLog[]>([]);
  const [likedLogIds, setLikedLogIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);
  const inFlightRef = useRef(false);

  const fetchPage = useCallback(
    async (replace: boolean) => {
      if (mode === 'self' && !user) {
        setLogs([]);
        setLikedLogIds(new Set());
        setLoading(false);
        return;
      }
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      setError(null);
      if (replace) {
        offsetRef.current = 0;
        setLoading(true);
      }

      let query = supabase
        .from('coffee_logs')
        .select(SELECT_QUERY)
        .order('created_at', { ascending: false })
        .range(offsetRef.current, offsetRef.current + PAGE_SIZE - 1);

      if (mode === 'public') {
        query = query.eq('is_public', true);
        if (excludeSelf && user) query = query.neq('user_id', user.id);
      } else if (mode === 'self' && user) {
        query = query.eq('user_id', user.id);
      }

      // Run page fetch in parallel with liked-ids fetch on initial/refetch.
      const likedPromise =
        replace && user
          ? fetchUserLikedIds(user.id)
          : Promise.resolve<Set<string> | null>(null);

      const [{ data, error: err }, likedSet] = await Promise.all([query, likedPromise]);

      if (err) {
        setError(err.message);
        setLoading(false);
        inFlightRef.current = false;
        return;
      }

      const flattened = ((data ?? []) as unknown as RawCoffeeLogRow[]).map(flattenLog);
      if (replace) setLogs(flattened);
      else setLogs((prev) => [...prev, ...flattened]);

      if (likedSet) setLikedLogIds(likedSet);

      offsetRef.current += flattened.length;
      setHasMore(flattened.length === PAGE_SIZE);
      setLoading(false);
      inFlightRef.current = false;
    },
    [mode, user, excludeSelf],
  );

  const refetch = useCallback(() => fetchPage(true), [fetchPage]);
  const loadMore = useCallback(async () => {
    if (!hasMore || loading || inFlightRef.current) return;
    await fetchPage(false);
  }, [fetchPage, hasMore, loading]);

  // Optimistic toggle. Reverts state on error. Treats UNIQUE-constraint
  // (already-liked) errors as success rather than surfacing them.
  const toggleLike = useCallback(
    async (logId: string, currentlyLiked: boolean) => {
      if (!user) return;

      // Optimistic update
      setLikedLogIds((prev) => {
        const next = new Set(prev);
        if (currentlyLiked) next.delete(logId);
        else next.add(logId);
        return next;
      });
      setLogs((prev) =>
        prev.map((l) =>
          l.id === logId
            ? {
                ...l,
                likes_count: Math.max(0, l.likes_count + (currentlyLiked ? -1 : 1)),
              }
            : l,
        ),
      );

      try {
        if (currentlyLiked) {
          const { error: delErr } = await supabase
            .from('likes')
            .delete()
            .eq('log_id', logId)
            .eq('user_id', user.id);
          if (delErr) throw delErr;
        } else {
          const { error: insErr } = await supabase
            .from('likes')
            .insert({ log_id: logId, user_id: user.id });
          if (insErr) {
            // 23505 = unique_violation. Treat duplicate insert as already-liked success.
            const code = (insErr as { code?: string }).code;
            const isDuplicate =
              code === '23505' ||
              insErr.message.toLowerCase().includes('duplicate') ||
              insErr.message.toLowerCase().includes('unique');
            if (!isDuplicate) throw insErr;
          }
        }
      } catch {
        // Revert optimistic update on failure
        setLikedLogIds((prev) => {
          const next = new Set(prev);
          if (currentlyLiked) next.add(logId);
          else next.delete(logId);
          return next;
        });
        setLogs((prev) =>
          prev.map((l) =>
            l.id === logId
              ? {
                  ...l,
                  likes_count: Math.max(0, l.likes_count + (currentlyLiked ? 1 : -1)),
                }
              : l,
          ),
        );
      }
    },
    [user],
  );

  useEffect(() => {
    void fetchPage(true);
    // fetchPage identity changes when mode/user changes; re-fetch is intended.
  }, [fetchPage]);

  // Realtime: prepend new logs that match the filter.
  useEffect(() => {
    if (mode === 'self' && !user) return;
    const filter =
      mode === 'public'
        ? 'is_public=eq.true'
        : `user_id=eq.${user!.id}`;

    const channel = supabase
      .channel(`feed-${mode}-${user?.id ?? 'anon'}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'coffee_logs',
          filter,
        },
        async (payload) => {
          const newRow = payload.new as { id?: string; user_id?: string };
          if (!newRow.id) return;
          // When showing only others' logs, don't prepend the current user's.
          if (excludeSelf && user && newRow.user_id === user.id) return;
          const { data } = await supabase
            .from('coffee_logs')
            .select(SELECT_QUERY)
            .eq('id', newRow.id)
            .single();
          if (!data) return;
          const log = flattenLog(data as unknown as RawCoffeeLogRow);
          setLogs((prev) => (prev.some((l) => l.id === log.id) ? prev : [log, ...prev]));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mode, user, excludeSelf]);

  return {
    logs,
    likedLogIds,
    loading,
    error,
    hasMore,
    refetch,
    loadMore,
    toggleLike,
  };
}
