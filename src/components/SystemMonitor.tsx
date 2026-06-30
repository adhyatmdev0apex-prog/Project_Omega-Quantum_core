import { useProgress } from '../state/progress';
import {
  operatorLevel,
  xpInLevel,
  levelProgressPct,
  volumesCompletedCount,
  chaptersCompletedCount,
  labsCompletedCount,
  missionsCompletedCount,
  currentStreak,
  studyTimeFormatted,
  bookmarksCount,
  notesCount,
  currentStatus,
  totalAvailableVolumes,
  totalAvailableChapters,
  totalAvailableLabs,
  totalAvailableMissions,
} from '../state/progressEngine';
import { Icon } from './Icon';
import { GlassPanel, ProgressBar } from './ui';
import { cn } from '../lib/cn';

// ===========================================================
// SystemMonitor — real learning statistics, live.
// Replaces the previous fake CPU/RAM/Network jitter values
// with actual operator metrics. Every value updates from the
// persisted OperatorProfile.
// ===========================================================

const STATUS_META: Record<string, { label: string; color: string; pulse: string }> = {
  reading: { label: 'READING', color: 'text-neon-300', pulse: 'bg-neon-400' },
  lab: { label: 'IN LAB', color: 'text-cyan-300', pulse: 'bg-cyan-400' },
  mission: { label: 'ON MISSION', color: 'text-neon-300', pulse: 'bg-neon-400' },
  idle: { label: 'IDLE', color: 'text-slate-400', pulse: 'bg-slate-500' },
};

export function SystemMonitor() {
  const { state } = useProgress();

  const level = operatorLevel(state.xp);
  const xpInLvl = xpInLevel(state.xp);
  const xpPct = levelProgressPct(state.xp);
  const status = currentStatus(state);
  const sm = STATUS_META[status];

  const stats = [
    { id: 'volumes', label: 'Volumes', icon: 'BookOpen', value: volumesCompletedCount(state), total: totalAvailableVolumes(), color: 'neon' as const },
    { id: 'chapters', label: 'Chapters', icon: 'FileText', value: chaptersCompletedCount(state), total: totalAvailableChapters(), color: 'cyan' as const },
    { id: 'labs', label: 'Labs', icon: 'FlaskConical', value: labsCompletedCount(state), total: totalAvailableLabs(), color: 'neon' as const },
    { id: 'missions', label: 'Missions', icon: 'Crosshair', value: missionsCompletedCount(state), total: totalAvailableMissions(), color: 'cyan' as const },
    { id: 'streak', label: 'Streak', icon: 'Flame', value: currentStreak(state), total: 0, color: 'neon' as const, unit: 'd' },
    { id: 'study', label: 'Study', icon: 'Clock', value: studyTimeFormatted(state), total: 0, color: 'cyan' as const, raw: true },
    { id: 'bookmarks', label: 'Bookmarks', icon: 'Bookmark', value: bookmarksCount(state), total: 0, color: 'neon' as const },
    { id: 'notes', label: 'Notes', icon: 'StickyNote', value: notesCount(state), total: 0, color: 'cyan' as const },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="section-eyebrow">System Monitor</div>
        <span className={cn('flex items-center gap-1.5 font-mono text-[10px]', sm.color)}>
          <span className={cn('h-1.5 w-1.5 animate-pulse rounded-full', sm.pulse)} /> {sm.label}
        </span>
      </div>

      {/* XP / Level */}
      <GlassPanel variant="cyan" className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Operator Level</div>
            <div className="font-display text-2xl font-bold text-cyan-300 text-glow-cyan">LV {level}</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">XP</div>
            <div className="font-mono text-lg text-neon-300">{state.xp.toLocaleString()}</div>
          </div>
        </div>
        <ProgressBar value={xpPct} className="mt-3" />
        <div className="mt-1.5 flex justify-between font-mono text-[10px] text-slate-500">
          <span>{xpInLvl} / 500</span>
          <span>next: LV {level + 1}</span>
        </div>
      </GlassPanel>

      {/* Real learning metrics */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((m) => {
          const display = m.raw ? m.value : `${m.value}${m.unit ?? ''}`;
          const barVal = m.total > 0 ? (m.value / m.total) * 100 : 0;
          return (
            <GlassPanel key={m.id} className="p-3">
              <div className="flex items-center gap-2">
                <Icon name={m.icon} size={14} className={m.color === 'neon' ? 'text-neon-400' : 'text-cyan-400'} />
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">{m.label}</span>
              </div>
              <div className={cn('mt-1.5 font-display text-xl font-semibold', m.color === 'neon' ? 'text-neon-300' : 'text-cyan-300')}>
                {display}
                {m.total > 0 && <span className="ml-1 font-mono text-[10px] text-slate-500">/ {m.total}</span>}
              </div>
              {m.total > 0 && <ProgressBar value={barVal} className="mt-2" />}
            </GlassPanel>
          );
        })}
      </div>
    </div>
  );
}
