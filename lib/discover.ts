import { useCallback, useEffect, useRef, useState } from 'react';

import { useSession } from '@/lib/auth';
import { fetchUserLikedIds } from '@/lib/feed';
import { supabase } from '@/lib/supabase';
import type { CafeSummary, CoffeeLog, RawCoffeeLogRow } from '@/lib/types';

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 400;

const SELECT_QUERY = `
  *,
  cafe:cafes(id, name_ar, city),
  profile:profiles!user_id(username, display_name_ar, city),
  log_flavor_notes(
    flavor_note:flavor_notes(id, name_ar, color_hex, emoji, level)
  ),
  likes_count:likes(count)
`;

export type CafeWithCount = CafeSummary & { log_count: number };

type RawCafeRow = {
  id: string;
  name_ar: string;
  city: string | null;
  logs_count: { count: number }[] | null;
};

function flattenCafe(raw: RawCafeRow): CafeWithCount {
  const count = Array.isArray(raw.logs_count) ? (raw.logs_count[0]?.count ?? 0) : 0;
  return { id: raw.id, name_ar: raw.name_ar, city: raw.city ?? null, log_count: count };
}

function flattenLog(raw: RawCoffeeLogRow): CoffeeLog {
  const { log_flavor_notes, likes_count, ...rest } = raw;
  const flavor_notes = (log_flavor_notes ?? [])
    .map((entry) => entry.flavor_note)
    .filter((n): n is NonNullable<typeof n> => !!n);
  const count = Array.isArray(likes_count) ? (likes_count[0]?.count ?? 0) : 0;
  return { ...rest, flavor_notes, likes_count: count };
}

// ─── Top 10 cafes by log count (default/empty-query state) ───────────────────

export function useTopCafes() {
  const [cafes, setCafes] = useState<CafeWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void supabase
      .from('cafes')
      .select('id, name_ar, city, logs_count:coffee_logs(count)')
      .limit(100)
      .then(({ data }) => {
        if (cancelled) return;
        const rows = (data ?? []) as unknown as RawCafeRow[];
        const sorted = rows
          .map(flattenCafe)
          .sort((a, b) => b.log_count - a.log_count)
          .slice(0, 10);
        setCafes(sorted);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { cafes, loading };
}

// ─── Debounced cafe search ────────────────────────────────────────────────────

export function useCafeSearch(query: string) {
  const [cafes, setCafes] = useState<CafeWithCount[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setCafes([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      void supabase
        .from('cafes')
        .select('id, name_ar, city, logs_count:coffee_logs(count)')
        .ilike('name_ar', `%${trimmed}%`)
        .limit(20)
        .then(({ data }) => {
          if (cancelled) return;
          const rows = (data ?? []) as unknown as RawCafeRow[];
          setCafes(rows.map(flattenCafe).sort((a, b) => b.log_count - a.log_count));
          setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  return { cafes, loading };
}

// ─── Public logs for a specific cafe ─────────────────────────────────────────

type UseCafeLogsReturn = {
  logs: CoffeeLog[];
  likedLogIds: Set<string>;
  loading: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  toggleLike: (logId: string, currentlyLiked: boolean) => Promise<void>;
};

export function useCafeLogs(cafeId: string | null): UseCafeLogsReturn {
  const { user } = useSession();
  const [logs, setLogs] = useState<CoffeeLog[]>([]);
  const [likedLogIds, setLikedLogIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);
  const inFlightRef = useRef(false);

  const fetchPage = useCallback(
    async (replace: boolean) => {
      if (!cafeId || inFlightRef.current) return;
      inFlightRef.current = true;
      if (replace) {
        offsetRef.current = 0;
        setLoading(true);
      }

      const likedPromise =
        replace && user ? fetchUserLikedIds(user.id) : Promise.resolve<Set<string> | null>(null);

      const [{ data }, likedSet] = await Promise.all([
        supabase
          .from('coffee_logs')
          .select(SELECT_QUERY)
          .eq('cafe_id', cafeId)
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .range(offsetRef.current, offsetRef.current + PAGE_SIZE - 1),
        likedPromise,
      ]);

      const flattened = ((data ?? []) as unknown as RawCoffeeLogRow[]).map(flattenLog);
      if (replace) setLogs(flattened);
      else setLogs((prev) => [...prev, ...flattened]);

      if (likedSet) setLikedLogIds(likedSet);

      offsetRef.current += flattened.length;
      setHasMore(flattened.length === PAGE_SIZE);
      setLoading(false);
      inFlightRef.current = false;
    },
    [cafeId, user],
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || loading || inFlightRef.current) return;
    await fetchPage(false);
  }, [fetchPage, hasMore, loading]);

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
            ? { ...l, likes_count: Math.max(0, l.likes_count + (currentlyLiked ? -1 : 1)) }
            : l,
        ),
      );
      try {
        if (currentlyLiked) {
          const { error } = await supabase
            .from('likes')
            .delete()
            .eq('log_id', logId)
            .eq('user_id', user.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('likes')
            .insert({ log_id: logId, user_id: user.id });
          if (error) {
            const code = (error as { code?: string }).code;
            const isDuplicate =
              code === '23505' ||
              error.message.toLowerCase().includes('duplicate') ||
              error.message.toLowerCase().includes('unique');
            if (!isDuplicate) throw error;
          }
        }
      } catch {
        // Revert on failure
        setLikedLogIds((prev) => {
          const next = new Set(prev);
          if (currentlyLiked) next.add(logId);
          else next.delete(logId);
          return next;
        });
        setLogs((prev) =>
          prev.map((l) =>
            l.id === logId
              ? { ...l, likes_count: Math.max(0, l.likes_count + (currentlyLiked ? 1 : -1)) }
              : l,
          ),
        );
      }
    },
    [user],
  );

  // Reset + fetch when cafeId changes
  useEffect(() => {
    if (!cafeId) {
      setLogs([]);
      setLikedLogIds(new Set());
      setHasMore(true);
      return;
    }
    setLogs([]);
    setLikedLogIds(new Set());
    setHasMore(true);
    offsetRef.current = 0;
    inFlightRef.current = false;
    void fetchPage(true);
    // fetchPage identity changes with cafeId/user; triggering on cafeId alone is intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cafeId]);

  return { logs, likedLogIds, loading, hasMore, loadMore, toggleLike };
}
