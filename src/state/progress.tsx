import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { loadProgress, saveProgress } from './progressSync';

// ===========================================================
// Progress store — XP, completed labs/volumes/missions.
// Persisted to localStorage; structured for future Supabase sync.
// ===========================================================

export interface ProgressState {
  xp: number;
  completedLabs: string[];
  completedVolumes: string[];
  missionProgress: Record<string, number>; // missionId -> 0..100
  booted: boolean;
  notesCount: number;
}

const DEFAULTS: ProgressState = {
  xp: 0,
  completedLabs: [],
  completedVolumes: [],
  missionProgress: {},
  booted: false,
  notesCount: 0,
};

const KEY = 'qc.progress.v1';

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

interface ProgressCtx {
  state: ProgressState;
  addXp: (n: number) => void;
  completeLab: (id: string, xp?: number) => void;
  completeVolume: (id: string, xp?: number) => void;
  setMissionProgress: (id: string, pct: number) => void;
  markBooted: () => void;
  setNotesCount: (n: number) => void;
  reset: () => void;
}

const Ctx = createContext<ProgressCtx | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(() => load());
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from Supabase on mount (durable source of truth), then keep local.
  useEffect(() => {
    let mounted = true;
    (async () => {
      const remote = await loadProgress();
      if (mounted && remote) {
        setState((local) => ({ ...local, ...remote, notesCount: local.notesCount }));
      }
      if (mounted) setHydrated(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Persist to localStorage immediately, debounce-push to Supabase.
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
    if (!hydrated) return;
    const t = window.setTimeout(() => {
      void saveProgress(state);
    }, 800);
    return () => window.clearTimeout(t);
  }, [state, hydrated]);

  const addXp = useCallback((n: number) => {
    setState((s) => ({ ...s, xp: Math.max(0, s.xp + n) }));
  }, []);

  const completeLab = useCallback((id: string, xp = 100) => {
    setState((s) =>
      s.completedLabs.includes(id)
        ? s
        : { ...s, completedLabs: [...s.completedLabs, id], xp: s.xp + xp },
    );
  }, []);

  const completeVolume = useCallback((id: string, xp = 250) => {
    setState((s) =>
      s.completedVolumes.includes(id)
        ? s
        : { ...s, completedVolumes: [...s.completedVolumes, id], xp: s.xp + xp },
    );
  }, []);

  const setMissionProgress = useCallback((id: string, pct: number) => {
    setState((s) => ({ ...s, missionProgress: { ...s.missionProgress, [id]: pct } }));
  }, []);

  const markBooted = useCallback(() => setState((s) => ({ ...s, booted: true })), []);
  const setNotesCount = useCallback((n: number) => setState((s) => ({ ...s, notesCount: n })), []);
  const reset = useCallback(() => setState(DEFAULTS), []);

  const value = useMemo<ProgressCtx>(
    () => ({ state, addXp, completeLab, completeVolume, setMissionProgress, markBooted, setNotesCount, reset }),
    [state, addXp, completeLab, completeVolume, setMissionProgress, markBooted, setNotesCount, reset],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProgress() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
