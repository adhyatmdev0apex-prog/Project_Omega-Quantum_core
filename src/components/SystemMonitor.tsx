import { useEffect, useState } from 'react';
import { useProgress } from '../state/progress';
import { Icon } from './Icon';
import { GlassPanel, ProgressBar } from './ui';
import { cn } from '../lib/cn';

// ===========================================================
// SystemMonitor — aesthetic live indicators (CPU/RAM/Storage/
// Network/XP/Learning). No fake hacking; smooth animated gauges.
// ===========================================================

interface Metric {
  id: string;
  label: string;
  icon: string;
  unit: string;
  base: number;
  jitter: number;
  color: 'neon' | 'cyan';
}

const METRICS: Metric[] = [
  { id: 'cpu', label: 'CPU', icon: 'Cpu', unit: '%', base: 34, jitter: 18, color: 'neon' },
  { id: 'ram', label: 'Memory', icon: 'Activity', unit: '%', base: 52, jitter: 12, color: 'cyan' },
  { id: 'storage', label: 'Storage', icon: 'HardDrive', unit: '%', base: 41, jitter: 4, color: 'neon' },
  { id: 'network', label: 'Network', icon: 'Wifi', unit: 'Mb/s', base: 88, jitter: 40, color: 'cyan' },
];

export function SystemMonitor() {
  const { state } = useProgress();
  const [vals, setVals] = useState<Record<string, number>>(() =>
    Object.fromEntries(METRICS.map((m) => [m.id, m.base])),
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      setVals((prev) => {
        const next: Record<string, number> = {};
        for (const m of METRICS) {
          const target = m.base + (Math.random() - 0.5) * 2 * m.jitter;
          // ease toward target for smooth motion
          next[m.id] = Math.max(0, Math.min(100, (prev[m.id] ?? m.base) * 0.7 + target * 0.3));
        }
        return next;
      });
    }, 1200);
    return () => window.clearInterval(id);
  }, []);

  const xpLevel = Math.floor(state.xp / 500) + 1;
  const xpInLevel = state.xp % 500;
  const xpPct = (xpInLevel / 500) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="section-eyebrow">System Monitor</div>
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-neon-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon-400" /> LIVE
        </span>
      </div>

      {/* XP / Level */}
      <GlassPanel variant="cyan" className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Operator Level</div>
            <div className="font-display text-2xl font-bold text-cyan-300 text-glow-cyan">LV {xpLevel}</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">XP</div>
            <div className="font-mono text-lg text-neon-300">{state.xp.toLocaleString()}</div>
          </div>
        </div>
        <ProgressBar value={xpPct} className="mt-3" />
        <div className="mt-1.5 flex justify-between font-mono text-[10px] text-slate-500">
          <span>{xpInLevel} / 500</span>
          <span>next: LV {xpLevel + 1}</span>
        </div>
      </GlassPanel>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3">
        {METRICS.map((m) => {
          const v = Math.round(vals[m.id] ?? m.base);
          return (
            <GlassPanel key={m.id} className="p-3">
              <div className="flex items-center gap-2">
                <Icon name={m.icon} size={14} className={m.color === 'neon' ? 'text-neon-400' : 'text-cyan-400'} />
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">{m.label}</span>
              </div>
              <div className={cn('mt-1.5 font-display text-xl font-semibold', m.color === 'neon' ? 'text-neon-300' : 'text-cyan-300')}>
                {v}
                <span className="ml-1 font-mono text-[10px] text-slate-500">{m.unit}</span>
              </div>
              <ProgressBar value={m.unit === '%' ? v : (v / 130) * 100} className="mt-2" />
            </GlassPanel>
          );
        })}
      </div>

      {/* Learning progress */}
      <GlassPanel className="p-4">
        <div className="section-eyebrow mb-2">Learning Progress</div>
        <ProgressRow label="Volumes" value={state.completedVolumes.length} total={5} />
        <ProgressRow label="Labs" value={state.completedLabs.length} total={10} />
        <ProgressRow label="Missions" value={Object.values(state.missionProgress).filter((v) => v >= 100).length} total={3} />
      </GlassPanel>
    </div>
  );
}

function ProgressRow({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total ? (value / total) * 100 : 0;
  return (
    <div className="mb-2.5 last:mb-0">
      <div className="mb-1 flex justify-between font-mono text-[11px]">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-500">{value}/{total}</span>
      </div>
      <ProgressBar value={pct} />
    </div>
  );
}
