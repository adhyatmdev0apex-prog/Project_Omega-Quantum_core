import { useState } from 'react';
import { useRouter } from '../state/router';
import { useProgress } from '../state/progress';
import { VOLUMES } from '../data/modules';
import { GlassPanel, NeonButton, Chip, SectionHeader, EmptyState } from '../components/ui';
import { Icon } from '../components/Icon';
import { cn } from '../lib/cn';

// ===========================================================
// TextbookPage — renders a volume's real HTML content inside
// the Quantum Core shell. Each volume slug maps to a static
// HTML file in /public/library/. The file is loaded in an
// iframe so the volume's own styling is preserved while the
// app shell (breadcrumb, cover, status, notes) wraps it.
// ===========================================================

// Map volume slug → HTML file in /public/library/.
// Add entries here as you drop new volume files into public/library/.
const VOLUME_FILES: Record<string, string> = {
  volume1: '/library/Volume_I.html',
  volume2: '/library/Volume_II.html',
  // volume3: '/library/Volume_III.html',
  // volume4: '/library/Volume_IV.html',
  // volume5: '/library/Volume_V.html',
};

export function TextbookPage({ slug }: { slug: string }) {
  const { navigate } = useRouter();
  const { completeVolume } = useProgress();
  const volume = VOLUMES.find((v) => v.slug === slug);
  const file = VOLUME_FILES[slug];

  if (!volume) {
    return (
      <EmptyState
        icon={<Icon name="BookOpen" size={32} />}
        title="Volume not found"
        description="This volume hasn’t been registered yet."
        action={<NeonButton variant="ghost" onClick={() => navigate('/library')}>Back to Library</NeonButton>}
      />
    );
  }

  const accent = volume.accent;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <button
        onClick={() => navigate('/library')}
        className="qc-focus flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-slate-500 hover:text-neon-300"
      >
        <Icon name="ChevronRight" size={12} className="rotate-180" /> Library
      </button>

      {/* Cover header */}
      <GlassPanel variant={accent === 'cyan' ? 'cyan' : 'default'} className="relative overflow-hidden p-0">
        <div
          className={cn(
            'relative h-40 overflow-hidden border-b border-white/5',
            accent === 'neon'
              ? 'bg-gradient-to-br from-neon-400/15 via-ink-850 to-ink-900'
              : 'bg-gradient-to-br from-cyan-400/15 via-ink-850 to-ink-900',
          )}
        >
          <div className="absolute inset-0 bg-grid-faint bg-grid opacity-40" />
          <div
            className="absolute right-8 top-5 font-display text-7xl font-bold opacity-20"
            style={{ color: accent === 'neon' ? '#39ff14' : '#00f0ff' }}
          >
            {volume.roman}
          </div>
          <div className="absolute bottom-5 left-8">
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-400">
              Volume {volume.roman}
            </div>
            <h1 className="mt-1 font-display text-3xl font-bold text-white text-glow">{volume.title}</h1>
            <p className="mt-1 text-sm text-slate-400">{volume.subtitle}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 p-4">
          <Chip variant={accent === 'neon' ? 'neon' : 'cyan'}>{volume.level}</Chip>
          <Chip><Icon name="BookOpen" size={11} /> {volume.chapters} chapters</Chip>
          <Chip><Icon name="Clock" size={11} /> {volume.estHours}h est.</Chip>
          <NeonButton
            variant={accent === 'cyan' ? 'cyan' : 'neon'}
            className="ml-auto"
            onClick={() => completeVolume(volume.id)}
          >
            <Icon name="CheckCircle2" size={14} /> Mark Complete
          </NeonButton>
        </div>
      </GlassPanel>

      {/* Volume content — real HTML in an iframe */}
      {file ? (
        <GlassPanel className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-slate-400">
              <Icon name="FileText" size={13} /> {file.split('/').pop()}
            </div>
            <a
              href={file}
              target="_blank"
              rel="noreferrer"
              className="qc-focus flex items-center gap-1 font-mono text-[11px] text-neon-300 hover:text-neon-200"
            >
              Open in new tab <Icon name="ExternalLink" size={12} />
            </a>
          </div>
          <iframe
            src={file}
            title={`Volume ${volume.roman} — ${volume.title}`}
            className="h-[75vh] w-full bg-white"
            loading="lazy"
          />
        </GlassPanel>
      ) : (
        <GlassPanel className="p-8 text-center">
          <Icon name="FileX" size={28} className="mx-auto text-slate-600" />
          <h3 className="mt-3 font-display text-lg text-slate-300">Content file not connected</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            No HTML file is mapped for this volume yet. Add an entry to{' '}
            <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[11px] text-neon-300">
              VOLUME_FILES
            </code>{' '}
            in <code className="font-mono text-[11px] text-neon-300">TextbookPage.tsx</code> and drop the
            file in <code className="font-mono text-[11px] text-neon-300">public/library/</code>.
          </p>
        </GlassPanel>
      )}

      {/* Operator notes */}
      <NotesBlock storageKey={`notes.vol.${volume.id}`} />
    </div>
  );
}

// Reusable notes block — autosaves to localStorage.
export function NotesBlock({ storageKey }: { storageKey: string }) {
  const [text, setText] = useState(() => {
    try {
      return localStorage.getItem(storageKey) ?? '';
    } catch {
      return '';
    }
  });

  const save = (v: string) => {
    setText(v);
    try {
      localStorage.setItem(storageKey, v);
    } catch {
      /* ignore */
    }
  };

  return (
    <GlassPanel className="p-5">
      <div className="mb-2 flex items-center justify-between">
        <div className="section-eyebrow">Operator Notes</div>
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-neon-400">
          <Icon name="Save" size={11} /> autosaved
        </span>
      </div>
      <textarea
        value={text}
        onChange={(e) => save(e.target.value)}
        placeholder="Notes autosave locally as you type…"
        className="qc-focus h-40 w-full resize-none rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-[13px] text-slate-200 placeholder:text-slate-600 focus:border-neon-400/40"
      />
    </GlassPanel>
  );
}
