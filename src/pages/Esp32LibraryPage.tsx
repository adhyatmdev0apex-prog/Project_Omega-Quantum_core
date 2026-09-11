import { useEffect, useState } from 'react';
import { useRouter } from '../state/router';
import { SectionHeader, GlassPanel, Chip } from '../components/ui';
import { Icon } from '../components/Icon';

// ===========================================================
// ESP-32 Library — domain selector.
// Projects and Resources are intentionally separate so the
// project guides stay untouched while reference material can
// grow independently inside public/library/ESP-32/resources/.
// ===========================================================

interface LibraryCounts {
  projects: number;
  resources: number;
}

export function Esp32LibraryPage() {
  const { navigate } = useRouter();
  const [counts, setCounts] = useState<LibraryCounts | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch('/library/ESP-32/projects/manifest.json')
        .then((response) => (response.ok ? response.json() : []))
        .catch(() => []),
      fetch('/library/ESP-32/resources/manifest.json')
        .then((response) => (response.ok ? response.json() : []))
        .catch(() => []),
    ]).then(([projects, resources]) => {
      if (cancelled) return;

      setCounts({
        projects: Array.isArray(projects) ? projects.length : 0,
        resources: Array.isArray(resources) ? resources.length : 0,
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Knowledge Base / ESP-32"
        title="ESP-32"
        description="Embedded systems curriculum, projects, and reference resources — organized in one place."
      />

      <div className="grid gap-5 md:grid-cols-2">
        <GlassPanel
          variant="cyan"
          className="group cursor-pointer overflow-hidden p-0"
          hover
          onClick={() => navigate('/library/esp32/projects')}
        >
          <div className="relative h-40 overflow-hidden border-b border-white/5 bg-gradient-to-br from-cyan-400/15 via-ink-850 to-ink-900">
            <div className="absolute inset-0 bg-grid-faint bg-grid opacity-40" />
            <div className="absolute right-6 top-5 opacity-25">
              <Icon name="Cpu" size={72} className="text-cyan-400" />
            </div>
            <div className="absolute bottom-5 left-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-300/70">
                Hands-On Curriculum
              </div>
              <h3 className="font-display text-3xl font-bold text-white">Projects</h3>
            </div>
          </div>

          <div className="p-5">
            <p className="text-sm leading-relaxed text-slate-400">
              The complete ESP-32 project sequence. Each project opens the same standalone interactive HTML guide.
            </p>
            <div className="mt-5 flex items-center justify-between">
              <Chip variant="cyan">
                {counts === null ? 'Loading…' : `${counts.projects} projects`}
              </Chip>
              <span className="flex items-center gap-1 font-mono text-[11px] text-cyan-300 opacity-0 transition-opacity group-hover:opacity-100">
                Enter <Icon name="ArrowRight" size={12} />
              </span>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel
          variant="default"
          className="group cursor-pointer overflow-hidden p-0"
          hover
          onClick={() => navigate('/library/esp32/resources')}
        >
          <div className="relative h-40 overflow-hidden border-b border-white/5 bg-gradient-to-br from-neon-400/15 via-ink-850 to-ink-900">
            <div className="absolute inset-0 bg-grid-faint bg-grid opacity-40" />
            <div className="absolute right-6 top-5 opacity-25">
              <Icon name="Folder" size={72} className="text-neon-400" />
            </div>
            <div className="absolute bottom-5 left-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-neon-300/70">
                Reference Material
              </div>
              <h3 className="font-display text-3xl font-bold text-white">Resources</h3>
            </div>
          </div>

          <div className="p-5">
            <p className="text-sm leading-relaxed text-slate-400">
              Images, videos, PDFs, code archives, datasheets, and other files added to the ESP-32 resource library.
            </p>
            <div className="mt-5 flex items-center justify-between">
              <Chip variant="neon">
                {counts === null ? 'Loading…' : `${counts.resources} resources`}
              </Chip>
              <span className="flex items-center gap-1 font-mono text-[11px] text-neon-300 opacity-0 transition-opacity group-hover:opacity-100">
                Enter <Icon name="ArrowRight" size={12} />
              </span>
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
