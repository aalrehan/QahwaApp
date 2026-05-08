import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export type FlavorNote = {
  id: string;
  parent_id: string | null;
  name_en: string | null;
  name_ar: string;
  level: number;
  color_hex: string | null;
  emoji: string | null;
};

let cache: FlavorNote[] | null = null;
let inFlight: Promise<FlavorNote[]> | null = null;

async function fetchAll(): Promise<FlavorNote[]> {
  const { data, error } = await supabase
    .from('flavor_notes')
    .select('id, parent_id, name_en, name_ar, level, color_hex, emoji')
    .order('level', { ascending: true })
    .order('name_ar', { ascending: true });
  if (error) throw error;
  return (data ?? []) as FlavorNote[];
}

type State = {
  notes: FlavorNote[];
  loading: boolean;
  error: string | null;
};

export function useFlavorNotes() {
  const [state, setState] = useState<State>(() => ({
    notes: cache ?? [],
    loading: cache === null,
    error: null,
  }));

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      if (!inFlight) inFlight = fetchAll();
      const result = await inFlight;
      cache = result;
      setState({ notes: result, loading: false, error: null });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setState((s) => ({ ...s, loading: false, error: msg }));
    } finally {
      inFlight = null;
    }
  }, []);

  useEffect(() => {
    if (cache !== null) return;
    void load();
  }, [load]);

  return { ...state, refetch: load };
}

export function resetFlavorNotesCache() {
  cache = null;
  inFlight = null;
}

export type FlavorIndex = {
  primaries: FlavorNote[];
  getChildren: (parentId: string) => FlavorNote[];
  getById: (id: string) => FlavorNote | undefined;
};

export function groupFlavorNotes(notes: FlavorNote[]): FlavorIndex {
  const byId = new Map<string, FlavorNote>();
  const childrenByParent = new Map<string, FlavorNote[]>();
  for (const n of notes) {
    byId.set(n.id, n);
    if (n.parent_id) {
      const existing = childrenByParent.get(n.parent_id);
      if (existing) existing.push(n);
      else childrenByParent.set(n.parent_id, [n]);
    }
  }
  const primaries = notes
    .filter((n) => n.level === 1 && !n.parent_id)
    .sort((a, b) => a.name_ar.localeCompare(b.name_ar));
  return {
    primaries,
    getChildren: (parentId: string) =>
      (childrenByParent.get(parentId) ?? []).slice().sort((a, b) =>
        a.name_ar.localeCompare(b.name_ar),
      ),
    getById: (id: string) => byId.get(id),
  };
}
