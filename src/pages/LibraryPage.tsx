import { useRouter } from '../state/router';
import { useProgress } from '../state/progress';
import { VOLUMES } from '../data/modules';
import { GlassPanel, SectionHeader, Chip } from '../components/ui';
import { Icon } from '../components/Icon';
import { cn } from '../lib/cn';

// ===========================================================
// Library — the 5 volumes (expandable). Each card opens the
// shared Textbook layout.
// ===========================================================

export function LibraryPage() {
  const { navigate } = useRouter();
  const { state } = useProgress();

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Knowledge Base"
        title="Library"
        description="A five-volume curriculum from foundations to live cyber range. Built to grow — future volumes slot in automatically."
      />

      <div className="grid gap-5 md:grid-cols-2">
        {VOLUMES.map((v, i) => {
          const done = state.completedVolumes.includes(v.id);
          return (
            <GlassPanel
              key={v.id}
              variant={v.accent === 'cyan' ? 'cyan' : 'default'}
              className="group cursor-pointer overflow-hidden p-0"
              hover
              onClick={() => navigate(`/library/${v.slug}`)}
            >
              {/* Cover band */}
              <div
                className={cn(
                  'relative h-32 overflow-hidden border-b border-white/5',
                  v.accent === 'neon' ? 'bg-gradient-to-br from-neon-400/15 via-ink-850 to-ink-900' : 'bg-gradient-to-br from-cyan-400/15 via-ink-850 to-ink-900',
                )}
              >
                <div className="absolute inset-0 bg-grid-faint bg-grid opacity-40" />
                <div className="absolute right-4 top-4">
                  <span className={cn('font-display text-5xl font-bold opacity-30', v.accent === 'neon' ? 'text-neon-400' : 'text-cyan-400')}>
                    {v.roman}
                  </span>
                </div>
                <div className="absolute bottom-4 left-5">
                  <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-400">Volume {v.roman}</div>
                  <h3 className="font-display text-2xl font-bold text-white">{v.title}</h3>
                </div>
                {done && (
                  <span className="absolute left-4 top-4 flex items-center gap-1 rounded-full border border-neon-400/40 bg-neon-400/10 px-2 py-0.5 font-mono text-[10px] text-neon-300">
                    <Icon name="CheckCircle2" size={11} /> COMPLETE
                  </span>
                )}
              </div>

              {/* Body */}
              <div className="p-5">
                <p className="text-sm text-slate-400">{v.blurb}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Chip variant={v.accent === 'neon' ? 'neon' : 'cyan'}>{v.level}</Chip>
                  <Chip><Icon name="BookOpen" size={11} /> {v.chapters} chapters</Chip>
                  <Chip><Icon name="Clock" size={11} /> {v.estHours}h</Chip>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-mono text-[11px] text-slate-500">Volume {i + 1} of {VOLUMES.length}</span>
                  <span className="flex items-center gap-1 font-mono text-[11px] text-neon-300 opacity-0 transition-opacity group-hover:opacity-100">
                    Open <Icon name="ArrowRight" size={12} />
                  </span>
                </div>
              </div>
            </GlassPanel>
          );
        })}

        {/* Future volume slot */}
        <GlassPanel className="flex min-h-[220px] flex-col items-center justify-center border-dashed border-white/10 p-5 text-center">
          <Icon name="Sparkles" size={28} className="text-slate-600" />
          <h3 className="mt-3 font-display text-lg text-slate-400">More volumes ahead</h3>
          <p className="mt-1 max-w-xs text-sm text-slate-600">The registry auto-renders any new volume you add. Unlimited future support.</p>
        </GlassPanel>
      </div>
    </div>
  );
}
