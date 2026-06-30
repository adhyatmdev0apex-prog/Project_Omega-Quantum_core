import { VOLUMES, LABS, MISSIONS } from '../data/modules';
import type { OperatorProfile } from './profile';

// ===========================================================
// ProgressEngine — pure functions that derive learning stats
// from the operator profile. Reusable by Dashboard, SystemMonitor,
// Library, and future Labs/Missions modules. No side effects.
// ===========================================================

export const XP_PER_LEVEL = 500;

export function operatorLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function xpInLevel(xp: number): number {
  return xp % XP_PER_LEVEL;
}

export function xpToNextLevel(xp: number): number {
  return XP_PER_LEVEL - xpInLevel(xp);
}

export function levelProgressPct(xp: number): number {
  return (xpInLevel(xp) / XP_PER_LEVEL) * 100;
}

export function volumeCompletion(profile: OperatorProfile, volumeId: string): number {
  const chapters = profile.completedChapters[volumeId];
  const total = VOLUMES.find((v) => v.id === volumeId)?.chapters ?? 1;
  if (!chapters || chapters.length === 0) return 0;
  return Math.min(100, (chapters.length / total) * 100);
}

export function overallCompletion(profile: OperatorProfile): number {
  const totalChapters = VOLUMES.reduce((sum, v) => sum + v.chapters, 0);
  const done = VOLUMES.reduce(
    (sum, v) => sum + (profile.completedChapters[v.id]?.length ?? 0),
    0,
  );
  return totalChapters ? (done / totalChapters) * 100 : 0;
}

export function volumesCompletedCount(profile: OperatorProfile): number {
  return profile.completedVolumes.length;
}

export function chaptersCompletedCount(profile: OperatorProfile): number {
  return Object.values(profile.completedChapters).reduce((s, arr) => s + arr.length, 0);
}

export function labsCompletedCount(profile: OperatorProfile): number {
  return profile.completedLabs.length;
}

export function missionsCompletedCount(profile: OperatorProfile): number {
  return Object.values(profile.missionProgress).filter((v) => v >= 100).length;
}

export function bookmarksCount(profile: OperatorProfile): number {
  return profile.bookmarks.length;
}

export function notesCount(profile: OperatorProfile): number {
  return profile.notesCount;
}

export function studyTimeHours(profile: OperatorProfile): number {
  return Math.round((profile.totalStudyTime / 3600) * 10) / 10;
}

export function studyTimeFormatted(profile: OperatorProfile): string {
  const s = profile.totalStudyTime;
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}

export function currentStreak(profile: OperatorProfile): number {
  return profile.learningStreak;
}

export function currentStatus(profile: OperatorProfile): 'reading' | 'lab' | 'mission' | 'idle' {
  return profile.currentStatus;
}

export function totalAvailableChapters(): number {
  return VOLUMES.reduce((s, v) => s + v.chapters, 0);
}

export function totalAvailableLabs(): number {
  return LABS.length;
}

export function totalAvailableMissions(): number {
  return MISSIONS.length;
}

export function totalAvailableVolumes(): number {
  return VOLUMES.length;
}
