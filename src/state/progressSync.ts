import { supabase } from '../lib/supabase';
import type { ProgressState } from './progress';

// ===========================================================
// Supabase sync layer for operator progress (singleton row).
// localStorage stays the fast local cache; Supabase is durable.
// All calls are best-effort and fail silently to localStorage.
// ===========================================================

const TABLE = 'operator_progress';
const ROW_ID = 1;

interface DbProgress {
  xp: number;
  completed_labs: string[];
  completed_volumes: string[];
  mission_progress: Record<string, number>;
  booted: boolean;
}

export async function loadProgress(): Promise<ProgressState | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('xp, completed_labs, completed_volumes, mission_progress, booted')
      .eq('id', ROW_ID)
      .maybeSingle();
    if (error || !data) return null;
    const d = data as DbProgress;
    return {
      xp: d.xp ?? 0,
      completedLabs: d.completed_labs ?? [],
      completedVolumes: d.completed_volumes ?? [],
      missionProgress: d.mission_progress ?? {},
      booted: d.booted ?? false,
      notesCount: 0,
    };
  } catch {
    return null;
  }
}

export async function saveProgress(state: ProgressState): Promise<void> {
  if (!supabase) return;
  try {
    const payload = {
      id: ROW_ID,
      xp: state.xp,
      completed_labs: state.completedLabs,
      completed_volumes: state.completedVolumes,
      mission_progress: state.missionProgress,
      booted: state.booted,
      updated_at: new Date().toISOString(),
    };
    await supabase.from(TABLE).upsert(payload, { onConflict: 'id' });
  } catch {
    /* best-effort */
  }
}
