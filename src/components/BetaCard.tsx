// ===========================================================
// BetaCard — displays a single experimental lab entry.
// Large card with title, description, progress, status badge.
// ===========================================================

import { Icon } from './Icon';
import { GlassPanel, Chip, ProgressBar } from './ui';
import { cn } from '../lib/cn';
import type { BetaLab, BetaLabStatus } from '../data/betaLabs';

interface BetaCardProps {
  lab: BetaLab;
  onClick?: () => void;
}

const statusColors: Record<BetaLabStatus, string> = {
  experimental: 'text-warn-400 border-warn-400/40 bg-warn-400/10',
  alpha: 'text-orange-400 border-orange-400/40 bg-orange-400/10',
  beta: 'text-cyan-400 border-cyan-400/40 bg-cyan-400/10',
  preview: 'text-neon-400 border-neon-400/40 bg-neon-400/10',
};

const statusLabels: Record<BetaLabStatus, string> = {
  experimental: 'Experimental',
  alpha: 'Alpha',
  beta: 'Beta',
  preview: 'Preview',
};

export function BetaCard({ lab, onClick }: BetaCardProps) {
  return (
    <GlassPanel
      className={cn(
        'group cursor-pointer p-6 transition-all duration-300',
        onClick && 'hover:border-neon-400/30'
      )}
      hover
      onClick={onClick}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
          <Icon name={lab.icon} size={22} className="text-neon-400 group-hover:text-glow" />
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider', statusColors[lab.status])}>
            {statusLabels[lab.status]}
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 className="mt-4 font-display text-xl font-semibold text-white">{lab.title}</h3>

      {/* Description */}
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-400">{lab.description}</p>

      {/* Meta row */}
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span className="font-mono text-[11px] text-slate-400">{lab.version}</span>
        <span className="text-slate-700">|</span>
        <span className="flex items-center gap-1">
          <Icon name="Clock" size={11} /> {lab.lastUpdated}
        </span>
      </div>

      {/* Progress */}
      <div className="mt-4">
        <div className="mb-1.5 flex justify-between font-mono text-[10px]">
          <span className="text-slate-500">Development Progress</span>
          <span className="text-neon-300">{lab.progress}%</span>
        </div>
        <ProgressBar value={lab.progress} />
      </div>

      {/* Tags */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {lab.tags.map((tag) => (
          <Chip key={tag}>#{tag}</Chip>
        ))}
      </div>

      {/* Launch button */}
      <button
        className={cn(
          'mt-5 w-full rounded-lg border border-neon-400/30 bg-neon-400/10 px-4 py-2.5',
          'font-mono text-[11px] uppercase tracking-wider text-neon-300',
          'transition-all duration-200',
          'hover:border-neon-400/50 hover:bg-neon-400/20 hover:text-neon-200',
          'focus:outline-none focus:ring-2 focus:ring-neon-400/50'
        )}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        Launch Beta
      </button>
    </GlassPanel>
  );
}
