import { useEffect, useRef, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { CafeSummary } from '@/lib/types';

const DEBOUNCE_MS = 400;

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
