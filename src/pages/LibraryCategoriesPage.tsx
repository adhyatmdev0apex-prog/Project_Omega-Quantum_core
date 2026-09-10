import { useRouter } from '../state/router';
import { LIBRARY_CATEGORIES } from '../data/libraryCategories';
import { GlassPanel, SectionHeader, Chip } from '../components/ui';
import { Icon } from '../components/Icon';
import { cn } from '../lib/cn';

// ===========================================================
// Library — domain selector. First screen when entering the
// Library: pick a knowledge domain (Cyber Security, ESP-32, ...).
// Reads LIBRARY_CATEGORIES so future domains render automatically.
// Selecting a category navigates to /library/<slug>, handled by
// App.tsx's library route switch.
// ===========================================================

export function LibraryCategoriesPage() {
  const { navigate } = useRouter();

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Knowledge Base"
        title="Library"
        description="Choose a domain to enter its curriculum. Each domain has its own volumes, chapters, and progress."
      />

      <div className="grid gap-5 md:grid-cols-2">
        {LIBRARY_CATEGORIES.map((cat) => {
          const isActive = cat.status === 'active';
          return (
            <GlassPanel
              key={cat.id}
              variant={cat.accent === 'cyan' ? 'cyan' : 'default'}
              className="group cursor-pointer overflow-hidden p-0"
              hover
              onClick={() => navigate(`/library/${cat.slug}`)}
            >
              {/* Cover band */}
              <div
                className={cn(
                  'relative h-36 overflow-hidden border-b border-white/5',
                  cat.accent === 'neon' ? 'bg-gradient-to-br from-neon-400/15 via-ink-850 to-ink-900' : 'bg-gradient-to-br from-cyan-400/15 via-ink-850 to-ink-900',
                )}
              >
                <div className="absolute inset-0 bg-grid-faint bg-grid opacity-40" />
                <div className="absolute right-5 top-5 opacity-25">
                  <Icon name={cat.icon} size={64} className={cat.accent === 'neon' ? 'text-neon-400' : 'text-cyan-400'} />
                </div>
                <div className="absolute bottom-4 left-5">
                  <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-400">{cat.subtitle}</div>
                  <h3 className="font-display text-2xl font-bold text-white">{cat.title}</h3>
                </div>

                {!isActive && (
                  <div className="absolute left-4 top-4">
                    <span className="flex items-center gap-1 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-2 py-0.5 font-mono text-[10px] text-cyan-300">
                      <Icon name="Clock" size={11} /> COMING SOON
                    </span>
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="p-5">
                <p className="text-sm text-slate-400">{cat.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Chip variant={cat.accent === 'neon' ? 'neon' : 'cyan'}>
                    {isActive ? 'Active' : 'In development'}
                  </Chip>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <span className="font-mono text-[11px] text-slate-500">Domain</span>
                  <span
                    className={cn(
                      'flex items-center gap-1 font-mono text-[11px] opacity-0 transition-opacity group-hover:opacity-100',
                      cat.accent === 'neon' ? 'text-neon-300' : 'text-cyan-300',
                    )}
                  >
                    Enter <Icon name="ArrowRight" size={12} />
                  </span>
                </div>
              </div>
            </GlassPanel>
          );
        })}
      </div>
    </div>
  );
}
