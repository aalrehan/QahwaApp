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
  )
`;

function flattenLog(raw: RawCoffeeLogRow): CoffeeLog {
  const { log_flavor_notes, ...rest } = raw;
  const flavor_notes = (log_flavor_notes ?? [])
    .map((entry) => entry.flavor_note)
    .filter((n): n is NonNullable<typeof n> => !!n);
  return { ...rest, flavor_notes };
}

export type FeedMode = 'public' | 'self';

type UseFeedReturn = {
  logs: CoffeeLog[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
};

export function useFeed({ mode }: { mode: FeedMode }): UseFeedReturn {
  const { user } = useSession();
  const [logs, setLogs] = useState<CoffeeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);
  const inFlightRef = useRef(false);

  const fetchPage = useCallback(
    async (replace: boolean) => {
      if (mode === 'self' && !user) {
        setLogs([]);
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

      if (mode === 'public') query = query.eq('is_public', true);
      else if (mode === 'self' && user) query = query.eq('user_id', user.id);

      const { data, error: err } = await query;

      if (err) {
        setError(err.message);
        setLoading(false);
        inFlightRef.current = false;
        return;
      }

      const flattened = ((data ?? []) as unknown as RawCoffeeLogRow[]).map(flattenLog);
      if (replace) setLogs(flattened);
      else setLogs((prev) => [...prev, ...flattened]);

      offsetRef.current += flattened.length;
      setHasMore(flattened.length === PAGE_SIZE);
      setLoading(false);
      inFlightRef.current = false;
    },
    [mode, user],
  );

  const refetch = useCallback(() => fetchPage(true), [fetchPage]);
  const loadMore = useCallback(async () => {
    if (!hasMore || loading || inFlightRef.current) return;
    await fetchPage(false);
  }, [fetchPage, hasMore, loading]);

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
          const newRow = payload.new as { id?: string };
          if (!newRow.id) return;
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
  }, [mode, user]);

  return { logs, loading, error, hasMore, refetch, loadMore };
}
