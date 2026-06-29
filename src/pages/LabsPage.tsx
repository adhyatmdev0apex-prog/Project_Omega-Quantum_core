import { useRouter } from '../state/router';
import { useProgress } from '../state/progress';
import { LABS } from '../data/modules';
import { GlassPanel, SectionHeader, Chip } from '../components/ui';
import { Icon } from '../components/Icon';
import { cn } from '../lib/cn';

// ===========================================================
// Labs — 10 lab cards. Each links to its own page.
// ===========================================================

const diffColor: Record<string, 'neon' | 'cyan' | 'warn' | 'err'> = {
  Initiate: 'neon',
  Operator: 'cyan',
  Specialist: 'warn',
  Architect: 'err',
};

export function LabsPage() {
  const { navigate } = useRouter();
  const { state } = useProgress();

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Hands-on"
        title="Labs"
        description="Practical environments by tool and domain. Every card opens its own lab page."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LABS.map((lab) => {
          const done = state.completedLabs.includes(lab.id);
          return (
            <GlassPanel key={lab.id} className="group cursor-pointer p-5" hover onClick={() => navigate(`/labs/${lab.slug}`)}>
              <div className="flex items-start justify-between">
                <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]')}>
                  <Icon name={lab.icon} size={20} className="text-neon-400 group-hover:text-glow" />
                </div>
                {done && <Icon name="CheckCircle2" size={18} className="text-neon-400" />}
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold text-white">{lab.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-slate-400">{lab.blurb}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Chip variant={diffColor[lab.difficulty]}>{lab.difficulty}</Chip>
                <Chip><Icon name="Clock" size={11} /> {lab.estMinutes}m</Chip>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {lab.tags.map((t) => (
                  <span key={t} className="font-mono text-[10px] text-slate-600">#{t}</span>
                ))}
              </div>
            </GlassPanel>
          );
        })}
      </div>
    </div>
  );
}
