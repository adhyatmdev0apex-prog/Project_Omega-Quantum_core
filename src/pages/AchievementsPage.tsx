import { useState } from 'react';
import { ACHIEVEMENTS } from '../data/modules';
import { GlassPanel, SectionHeader, Chip, ProgressBar } from '../components/ui';
import { Icon } from '../components/Icon';
import { cn } from '../lib/cn';

// ===========================================================
// Achievements — expandable cards with progress tracking.
// ===========================================================

const tierColor: Record<string, string> = {
  bronze: 'border-warn-500/30 bg-warn-500/10 text-warn-400',
  silver: 'border-slate-300/30 bg-slate-300/10 text-slate-200',
  gold: 'border-warn-400/40 bg-warn-400/10 text-warn-400',
  platinum: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300',
};

export function AchievementsPage() {
  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Recognition"
        title="Achievements"
        description="Milestones earned across the platform. Expand any card for details."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {ACHIEVEMENTS.map((a) => (
          <AchievementCard key={a.id} a={a} />
        ))}
      </div>
    </div>
  );
}

function AchievementCard({ a }: { a: (typeof ACHIEVEMENTS)[number] }) {
  const [open, setOpen] = useState(false);
  const earned = a.progress >= 100;
  return (
    <GlassPanel className="overflow-hidden p-0" hover>
      <button onClick={() => setOpen((o) => !o)} className="qc-focus flex w-full items-center gap-4 p-5 text-left">
        <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border', earned ? tierColor[a.tier] : 'border-white/10 bg-white/5')}>
          <Icon name={earned ? 'Trophy' : 'Lock'} size={20} className={earned ? '' : 'text-slate-500'} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-semibold text-white">{a.title}</h3>
          <p className="mt-0.5 line-clamp-1 text-sm text-slate-400">{a.desc}</p>
          <div className="mt-2 flex items-center gap-2">
            <Chip className={tierColor[a.tier]}>{a.tier}</Chip>
            {a.xp > 0 && <Chip variant="neon"><Icon name="Zap" size={11} /> {a.xp} XP</Chip>}
          </div>
        </div>
        <Icon name="ChevronDown" size={16} className={cn('shrink-0 text-slate-500 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="border-t border-white/5 p-5 animate-fade-up">
          <div className="mb-1.5 flex justify-between font-mono text-[11px] text-slate-500">
            <span>Progress</span><span>{a.progress}%</span>
          </div>
          <ProgressBar value={a.progress} />
          <p className="mt-3 text-sm text-slate-400">
            {earned ? 'Achievement unlocked.' : 'Keep operating to unlock this milestone.'}
          </p>
        </div>
      )}
    </GlassPanel>
  );
}
