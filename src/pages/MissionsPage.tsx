import { useState } from 'react';
import { useRouter } from '../state/router';
import { useProgress } from '../state/progress';
import { MISSIONS, type MissionMeta } from '../data/modules';
import { GlassPanel, SectionHeader, Chip, ProgressBar, NeonButton } from '../components/ui';
import { Icon } from '../components/Icon';
import { cn } from '../lib/cn';

// ===========================================================
// Missions — expandable mission cards with difficulty, time,
// progress, status, and a mission button. Future-compatible.
// ===========================================================

const diffColor: Record<string, 'neon' | 'cyan' | 'warn' | 'err'> = {
  Initiate: 'neon',
  Operator: 'cyan',
  Specialist: 'warn',
  Architect: 'err',
};

const statusLabel: Record<string, { label: string; cls: string }> = {
  locked: { label: 'Locked', cls: 'text-slate-500 border-white/10 bg-white/5' },
  available: { label: 'Available', cls: 'text-neon-300 border-neon-400/30 bg-neon-400/10' },
  active: { label: 'Active', cls: 'text-cyan-300 border-cyan-400/30 bg-cyan-400/10' },
  complete: { label: 'Complete', cls: 'text-neon-300 border-neon-400/40 bg-neon-400/10' },
};

export function MissionsPage() {
  const { navigate } = useRouter();
  const { state } = useProgress();

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Operations"
        title="Missions"
        description="Structured engagements against defined objectives. New missions slot in as the platform grows."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {MISSIONS.map((m) => (
          <MissionCard
            key={m.id}
            mission={m}
            progress={state.missionProgress[m.id] ?? m.progress}
            onOpen={() => navigate(`/missions/${m.slug}`)}
          />
        ))}

        {/* Future mission slot */}
        <GlassPanel className="flex min-h-[200px] flex-col items-center justify-center border-dashed border-white/10 p-5 text-center">
          <Icon name="Sparkles" size={24} className="text-slate-600" />
          <h3 className="mt-2 font-display text-base text-slate-400">More missions incoming</h3>
          <p className="mt-1 text-sm text-slate-600">The registry auto-renders any new mission.</p>
        </GlassPanel>
      </div>
    </div>
  );
}

function MissionCard({ mission, progress, onOpen }: { mission: MissionMeta; progress: number; onOpen: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const locked = mission.status === 'locked';
  const status = statusLabel[mission.status];

  return (
    <GlassPanel className={cn('overflow-hidden p-0', locked && 'opacity-70')} hover>
      <button onClick={() => setExpanded((e) => !e)} className="qc-focus flex w-full items-center gap-4 p-5 text-left">
        <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border', locked ? 'border-white/10 bg-white/5' : 'border-neon-400/30 bg-neon-400/10')}>
          <Icon name={locked ? 'Lock' : 'Crosshair'} size={20} className={locked ? 'text-slate-500' : 'text-neon-400'} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-400">{mission.codename}</div>
          <h3 className="mt-0.5 font-display text-lg font-semibold text-white">{mission.title}</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Chip variant={diffColor[mission.difficulty]}>{mission.difficulty}</Chip>
            <Chip><Icon name="Clock" size={11} /> {mission.estMinutes}m</Chip>
            <span className={cn('chip', status.cls)}>{status.label}</span>
          </div>
        </div>
        <Icon name="ChevronDown" size={16} className={cn('shrink-0 text-slate-500 transition-transform', expanded && 'rotate-180')} />
      </button>

      {expanded && (
        <div className="border-t border-white/5 p-5 animate-fade-up">
          <p className="text-sm text-slate-400">{mission.briefing}</p>
          <div className="mt-3">
            <div className="mb-1.5 flex justify-between font-mono text-[11px] text-slate-500">
              <span>Progress</span><span>{progress}%</span>
            </div>
            <ProgressBar value={progress} />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-neon-300">
              <Icon name="Zap" size={12} /> {mission.reward} XP reward
            </span>
            <NeonButton disabled={locked} onClick={onOpen}>
              <Icon name="Play" size={14} /> {locked ? 'Locked' : 'Brief'}
            </NeonButton>
          </div>
        </div>
      )}
    </GlassPanel>
  );
}
