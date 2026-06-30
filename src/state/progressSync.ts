import type { OperatorProfile } from './progress';

// ===========================================================
// Cloud sync adapter (stub).
// The platform is offline-first; all persistence is local via
// saveManager. This module is the future hook for cloud sync —
// when enabled, it will push/pull the OperatorProfile to a
// remote store without changing call sites. Currently a no-op
// so the app runs fully local with no network dependency.
// ===========================================================

export async function loadProgress(): Promise<OperatorProfile | null> {
  return null;
}

export async function saveProgress(_state: OperatorProfile): Promise<void> {
  return;
}
