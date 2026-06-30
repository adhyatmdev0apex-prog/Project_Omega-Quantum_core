import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { loadStore, saveStore } from './saveManager';

// ===========================================================
// OperatorProfile — the full local operator state.
// No login, no auth, no Supabase. Fully offline-first.
// Auto-created on first visit, persists across sessions.
// Structured so a future cloud-sync adapter can slot in
// behind saveManager without touching components.
// ===========================================================

export type ReaderStatus = 'reading' | 'lab' | 'mission' | 'idle';

export interface Bookmark {
  id: string;
  volumeId: string;
  title: string;
  created: number;
}

export interface ActivityEntry {
  id: string;
  type: 'volume' | 'chapter' | 'lab' | 'mission' | 'note' | 'bookmark' | 'achievement' | 'boot';
  label: string;
  xp: number;
  ts: number;
}

export interface OperatorProfile {
  // Identity
  createdAt: number;
  lastSeen: number;

  // Progression
  xp: number;
  operatorLevel: number;

  // Completion tracking
  completedVolumes: string[];
  completedChapters: Record<string, string[]>; // volumeId -> chapter ids
  completedLabs: string[];
  missionProgress: Record<string, number>; // missionId -> 0..100

  // Reading state
  lastVolume: string | null; // volume slug
  lastScroll: number; // px within iframe
  lastOpenedAt: number;

  // Notes & bookmarks
  notesCount: number;
  bookmarks: Bookmark[];

  // Streak & study time
  learningStreak: number;
  lastStudyDay: string | null; // ISO date (YYYY-MM-DD)
  totalStudyTime: number; // seconds
  studySessionStart: number | null; // epoch ms

  // Activity feed
  activity: ActivityEntry[];

  // Current status
  currentStatus: ReaderStatus;

  // Boot flag
  booted: boolean;
}

const STORE_NAME = 'profile.v1';

const DEFAULTS: OperatorProfile = {
  createdAt: 0,
  lastSeen: 0,
  xp: 0,
  operatorLevel: 1,
  completedVolumes: [],
  completedChapters: {},
  completedLabs: [],
  missionProgress: {},
  lastVolume: null,
  lastScroll: 0,
  lastOpenedAt: 0,
  notesCount: 0,
  bookmarks: [],
  learningStreak: 0,
  lastStudyDay: null,
  totalStudyTime: 0,
  studySessionStart: null,
  activity: [],
  currentStatus: 'idle',
  booted: false,
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00').getTime();
  const db = new Date(b + 'T00:00:00').getTime();
  return Math.round((db - da) / 86400000);
}

function load(): OperatorProfile {
  const loaded = loadStore<OperatorProfile>(STORE_NAME, DEFAULTS);
  // First visit: stamp creation
  if (!loaded.createdAt) {
    loaded.createdAt = Date.now();
    loaded.lastSeen = Date.now();
  }
  return { ...DEFAULTS, ...loaded };
}

// ---- Context ----

interface ProgressCtx {
  state: OperatorProfile;
  addXp: (n: number, reason?: string) => void;
  completeVolume: (id: string, xp?: number) => void;
  completeChapter: (volumeId: string, chapterId: string, xp?: number) => void;
  completeLab: (id: string, xp?: number) => void;
  setMissionProgress: (id: string, pct: number, xp?: number) => void;
  markBooted: () => void;
  setNotesCount: (n: number) => void;
  addBookmark: (b: Omit<Bookmark, 'id' | 'created'>) => void;
  removeBookmark: (id: string) => void;
  setReadingState: (volumeSlug: string, scroll: number) => void;
  setStatus: (s: ReaderStatus) => void;
  startStudySession: () => void;
  endStudySession: () => void;
  reset: () => void;
}

const Ctx = createContext<ProgressCtx | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OperatorProfile>(() => load());
  const saveTimer = useRef<number | null>(null);

  // Debounced persist to localStorage via SaveManager
  useEffect(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      saveStore(STORE_NAME, { ...state, lastSeen: Date.now() });
    }, 250);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [state]);

  // Study-time accumulator: tick every 30s while a session is active
  useEffect(() => {
    if (state.studySessionStart === null) return;
    const id = window.setInterval(() => {
      setState((s) => {
        if (s.studySessionStart === null) return s;
        return { ...s, totalStudyTime: s.totalStudyTime + 30 };
      });
    }, 30000);
    return () => window.clearInterval(id);
  }, [state.studySessionStart]);

  // Streak update on mount
  useEffect(() => {
    setState((s) => {
      const today = todayISO();
      if (s.lastStudyDay === today) return s;
      let streak = s.learningStreak;
      if (s.lastStudyDay) {
        const gap = daysBetween(s.lastStudyDay, today);
        if (gap === 1) streak = s.learningStreak + 1;
        else if (gap > 1) streak = 1;
      } else {
        streak = 1;
      }
      return { ...s, learningStreak: streak, lastStudyDay: today };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pushActivity = useCallback(
    (s: OperatorProfile, entry: Omit<ActivityEntry, 'id' | 'ts'>): OperatorProfile => {
      const full: ActivityEntry = { ...entry, id: crypto.randomUUID(), ts: Date.now() };
      return { ...s, activity: [full, ...s.activity].slice(0, 50) };
    },
    [],
  );

  const addXp = useCallback(
    (n: number, reason?: string) => {
      setState((s) => {
        const next = { ...s, xp: Math.max(0, s.xp + n), operatorLevel: Math.floor(Math.max(0, s.xp + n) / 500) + 1 };
        return reason ? pushActivity(next, { type: 'achievement', label: reason, xp: n }) : next;
      });
    },
    [pushActivity],
  );

  const completeVolume = useCallback(
    (id: string, xp = 250) => {
      setState((s) => {
        if (s.completedVolumes.includes(id)) return s;
        const next = { ...s, completedVolumes: [...s.completedVolumes, id], xp: s.xp + xp };
        return pushActivity(next, { type: 'volume', label: `Completed volume ${id}`, xp });
      });
    },
    [pushActivity],
  );

  const completeChapter = useCallback(
    (volumeId: string, chapterId: string, xp = 50) => {
      setState((s) => {
        const existing = s.completedChapters[volumeId] ?? [];
        if (existing.includes(chapterId)) return s;
        const next = {
          ...s,
          completedChapters: { ...s.completedChapters, [volumeId]: [...existing, chapterId] },
          xp: s.xp + xp,
        };
        return pushActivity(next, { type: 'chapter', label: `Completed chapter ${chapterId}`, xp });
      });
    },
    [pushActivity],
  );

  const completeLab = useCallback(
    (id: string, xp = 100) => {
      setState((s) => {
        if (s.completedLabs.includes(id)) return s;
        const next = { ...s, completedLabs: [...s.completedLabs, id], xp: s.xp + xp };
        return pushActivity(next, { type: 'lab', label: `Completed lab ${id}`, xp });
      });
    },
    [pushActivity],
  );

  const setMissionProgress = useCallback(
    (id: string, pct: number, xp = 0) => {
      setState((s) => {
        const prev = s.missionProgress[id] ?? 0;
        const next = { ...s, missionProgress: { ...s.missionProgress, [id]: pct } };
        if (pct >= 100 && prev < 100) {
          next.xp = s.xp + xp;
          return pushActivity(next, { type: 'mission', label: `Completed mission ${id}`, xp });
        }
        return next;
      });
    },
    [pushActivity],
  );

  const markBooted = useCallback(() => {
    setState((s) => {
      if (s.booted) return s;
      const next = { ...s, booted: true, xp: s.xp + 50 };
      return pushActivity(next, { type: 'boot', label: 'System boot', xp: 50 });
    });
  }, [pushActivity]);

  const setNotesCount = useCallback((n: number) => {
    setState((s) => (s.notesCount === n ? s : { ...s, notesCount: n }));
  }, []);

  const addBookmark = useCallback(
    (b: Omit<Bookmark, 'id' | 'created'>) => {
      setState((s) => {
        const full: Bookmark = { ...b, id: crypto.randomUUID(), created: Date.now() };
        if (s.bookmarks.some((x) => x.volumeId === b.volumeId && x.title === b.title)) return s;
        return pushActivity({ ...s, bookmarks: [full, ...s.bookmarks] }, { type: 'bookmark', label: b.title, xp: 0 });
      });
    },
    [pushActivity],
  );

  const removeBookmark = useCallback((id: string) => {
    setState((s) => ({ ...s, bookmarks: s.bookmarks.filter((b) => b.id !== id) }));
  }, []);

  const setReadingState = useCallback((volumeSlug: string, scroll: number) => {
    setState((s) => ({ ...s, lastVolume: volumeSlug, lastScroll: scroll, lastOpenedAt: Date.now() }));
  }, []);

  const setStatus = useCallback((status: ReaderStatus) => {
    setState((s) => (s.currentStatus === status ? s : { ...s, currentStatus: status }));
  }, []);

  const startStudySession = useCallback(() => {
    setState((s) => (s.studySessionStart !== null ? s : { ...s, studySessionStart: Date.now() }));
  }, []);

  const endStudySession = useCallback(() => {
    setState((s) => {
      if (s.studySessionStart === null) return s;
      const elapsed = Math.round((Date.now() - s.studySessionStart) / 1000);
      return { ...s, studySessionStart: null, totalStudyTime: s.totalStudyTime + elapsed };
    });
  }, []);

  const reset = useCallback(() => {
    const fresh = { ...DEFAULTS, createdAt: Date.now(), lastSeen: Date.now() };
    setState(fresh);
  }, []);

  const value = useMemo<ProgressCtx>(
    () => ({
      state,
      addXp,
      completeVolume,
      completeChapter,
      completeLab,
      setMissionProgress,
      markBooted,
      setNotesCount,
      addBookmark,
      removeBookmark,
      setReadingState,
      setStatus,
      startStudySession,
      endStudySession,
      reset,
    }),
    [state, addXp, completeVolume, completeChapter, completeLab, setMissionProgress, markBooted, setNotesCount, addBookmark, removeBookmark, setReadingState, setStatus, startStudySession, endStudySession, reset],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProgress() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
