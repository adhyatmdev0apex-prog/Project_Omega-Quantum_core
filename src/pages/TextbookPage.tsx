import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from '../state/router';
import { useProgress } from '../state/progress';
import { VOLUMES } from '../data/modules';
import { volumeCompletion } from '../state/progressEngine';
import { GlassPanel, NeonButton, Chip, EmptyState, ProgressBar } from '../components/ui';
import { WorkspaceIframe } from '../components/WorkspaceIframe';
import { Icon } from '../components/Icon';
import { cn } from '../lib/cn';

// ===========================================================
// TextbookPage — renders a volume's real HTML content inside
// the Quantum Core shell. Each volume slug maps to a static
// HTML file in /public/library/. Loaded in an iframe so the
// volume's own styling is preserved while the app shell wraps it.
//
// Reader features: loading indicator, fullscreen, open-in-new-tab,
// back-to-library, prev/next volume, reader status indicator,
// scroll save/restore, responsive sizing.
// ===========================================================

const VOLUME_FILES: Record<string, string> = {
  volume1: '/library/Volume_I.html',
  volume2: '/library/Volume_II.html',
  // volume3: '/library/Volume_III.html',
  // volume4: '/library/Volume_IV.html',
  // volume5: '/library/Volume_V.html',
};

export function TextbookPage({ slug }: { slug: string }) {
  const { navigate } = useRouter();
  const { state, completeVolume, setReadingState, setStatus, startStudySession, endStudySession, addBookmark } = useProgress();
  const volume = VOLUMES.find((v) => v.slug === slug);
  const file = VOLUME_FILES[slug];

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);

  const idx = VOLUMES.findIndex((v) => v.slug === slug);
  const prev = idx > 0 ? VOLUMES[idx - 1] : null;
  const next = idx < VOLUMES.length - 1 ? VOLUMES[idx + 1] : null;

  // Set status to reading while this page is mounted
  useEffect(() => {
    setStatus('reading');
    startStudySession();
    return () => {
      setStatus('idle');
      endStudySession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Track scroll position inside iframe (best-effort, same-origin only)
  const onIframeLoad = useCallback((_e: React.SyntheticEvent<HTMLIFrameElement>) => {
    try {
      const f = iframeRef.current;
      if (!f || !f.contentWindow) return;
      const win = f.contentWindow;
      const doc = win.document;

      // Restore saved scroll
      if (state.lastVolume === slug && state.lastScroll > 0) {
        win.scrollTo(0, state.lastScroll);
      }

      const onScroll = () => {
        const max = doc.documentElement.scrollHeight - win.innerHeight;
        const y = win.scrollY;
        setScrollPct(max > 0 ? (y / max) * 100 : 0);
        setReadingState(slug, y);
      };
      win.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    } catch {
      // cross-origin: can't track scroll, but iframe still renders
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const toggleFullscreen = () => setFullscreen((f) => !f);

  const goVolume = (vSlug: string) => {
    navigate(`/library/${vSlug}`);
  };

  if (!volume) {
    return (
      <EmptyState
        icon={<Icon name="BookOpen" size={32} />}
        title="Volume not found"
        description="This volume hasn't been registered yet."
        action={<NeonButton variant="ghost" onClick={() => navigate('/library/cyber')}>Back to Library</NeonButton>}
      />
    );
  }

  const accent = volume.accent;
  const progress = volumeCompletion(state, volume.id);
  const isComplete = state.completedVolumes.includes(volume.id);
  const isCurrent = state.lastVolume === slug;

  return (
    <div className={cn('space-y-6', fullscreen && 'fixed inset-0 z-50 bg-ink-950 p-4')}>
      {/* Top toolbar — always visible */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate('/library/cyber')}
          className="qc-focus flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-slate-500 hover:text-neon-300"
        >
          <Icon name="ChevronRight" size={12} className="rotate-180" /> Library
        </button>
        <div className="flex items-center gap-2">
          {/* Reader status indicator */}
          <span className="flex items-center gap-1.5 rounded-full border border-neon-400/30 bg-neon-400/10 px-2.5 py-1 font-mono text-[10px] text-neon-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon-400" /> READING
          </span>
          {file && (
            <a
              href={file}
              target="_blank"
              rel="noreferrer"
              className="qc-focus flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 font-mono text-[10px] text-slate-400 hover:text-neon-300"
            >
              <Icon name="ExternalLink" size={11} /> New Tab
            </a>
          )}
          <button
            onClick={toggleFullscreen}
            className="qc-focus flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 font-mono text-[10px] text-slate-400 hover:text-neon-300"
          >
            <Icon name={fullscreen ? 'Minimize2' : 'Maximize2'} size={11} /> {fullscreen ? 'Exit' : 'Fullscreen'}
          </button>
        </div>
      </div>

      {/* Cover header — hidden in fullscreen */}
      {!fullscreen && (
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
            {isCurrent && (
              <span className="absolute right-8 bottom-5 flex items-center gap-1.5 rounded-full border border-neon-400/40 bg-neon-400/10 px-2.5 py-1 font-mono text-[10px] text-neon-300">
                <Icon name="Bookmark" size={11} /> CURRENT
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 p-4">
            <Chip variant={accent === 'neon' ? 'neon' : 'cyan'}>{volume.level}</Chip>
            <Chip><Icon name="BookOpen" size={11} /> {volume.chapters} chapters</Chip>
            <Chip><Icon name="Clock" size={11} /> {volume.estHours}h est.</Chip>
            {isComplete && (
              <Chip variant="neon"><Icon name="CheckCircle2" size={11} /> COMPLETE</Chip>
            )}
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => addBookmark({ volumeId: volume.id, title: `Volume ${volume.roman} — ${volume.title}` })}
                className="qc-focus flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 font-mono text-[11px] text-slate-400 hover:text-neon-300"
              >
                <Icon name="Bookmark" size={12} /> Bookmark
              </button>
              <NeonButton
                variant={accent === 'cyan' ? 'cyan' : 'neon'}
                onClick={() => completeVolume(volume.id)}
              >
                <Icon name="CheckCircle2" size={14} /> Mark Complete
              </NeonButton>
            </div>
          </div>
          {/* Volume progress bar */}
          <div className="border-t border-white/5 px-4 py-2.5">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Progress</span>
              <ProgressBar value={progress} className="flex-1" />
              <span className="font-mono text-[11px] text-neon-300">{Math.round(progress)}%</span>
            </div>
          </div>
        </GlassPanel>
      )}

      {/* Volume content — real HTML in an iframe */}
      {file ? (
        <GlassPanel className={cn('overflow-hidden p-0', fullscreen && 'flex h-full flex-col')}>
          {/* Reader toolbar */}
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-slate-400">
              <Icon name="FileText" size={13} /> {file.split('/').pop()}
            </div>
            <div className="flex items-center gap-3">
              {/* Scroll progress */}
              <span className="hidden items-center gap-1.5 font-mono text-[10px] text-slate-500 sm:flex">
                <Icon name="ArrowDown" size={11} /> {Math.round(scrollPct)}%
              </span>
              {/* Prev / Next */}
              <div className="flex items-center gap-1">
                <button
                  disabled={!prev}
                  onClick={() => prev && goVolume(prev.slug)}
                  className={cn('qc-focus rounded-lg border border-white/10 p-1.5', prev ? 'text-slate-400 hover:text-neon-300' : 'cursor-not-allowed text-slate-700')}
                  title={prev ? `Volume ${prev.roman} — ${prev.title}` : 'No previous volume'}
                >
                  <Icon name="ChevronLeft" size={14} />
                </button>
                <button
                  disabled={!next}
                  onClick={() => next && goVolume(next.slug)}
                  className={cn('qc-focus rounded-lg border border-white/10 p-1.5', next ? 'text-slate-400 hover:text-neon-300' : 'cursor-not-allowed text-slate-700')}
                  title={next ? `Volume ${next.roman} — ${next.title}` : 'No next volume'}
                >
                  <Icon name="ChevronRight" size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Iframe — WorkspaceIframe handles loading/error states */}
          <WorkspaceIframe
            ref={iframeRef}
            src={file}
            title={`Volume ${volume.roman} — ${volume.title}`}
            onLoad={onIframeLoad}
            loading="lazy"
            loadingLabel="Loading volume…"
            className={cn(fullscreen ? 'flex-1' : 'h-[75vh]')}
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

      {/* Prev/Next volume nav — hidden in fullscreen */}
      {!fullscreen && (
        <div className="grid gap-4 sm:grid-cols-2">
          {prev ? (
            <button onClick={() => goVolume(prev.slug)} className="qc-focus text-left">
              <GlassPanel className="group p-4" hover>
                <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Previous</div>
                <div className="mt-1 flex items-center gap-2">
                  <Icon name="ChevronLeft" size={16} className="text-slate-500 group-hover:text-neon-300" />
                  <span className="font-display text-base font-semibold text-white">Vol {prev.roman} — {prev.title}</span>
                </div>
              </GlassPanel>
            </button>
          ) : <div />}
          {next ? (
            <button onClick={() => goVolume(next.slug)} className="qc-focus text-right">
              <GlassPanel className="group p-4" hover>
                <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Next</div>
                <div className="mt-1 flex items-center justify-end gap-2">
                  <span className="font-display text-base font-semibold text-white">Vol {next.roman} — {next.title}</span>
                  <Icon name="ChevronRight" size={16} className="text-slate-500 group-hover:text-neon-300" />
                </div>
              </GlassPanel>
            </button>
          ) : <div />}
        </div>
      )}

      {/* Operator notes — hidden in fullscreen */}
      {!fullscreen && <NotesBlock storageKey={`notes.vol.${volume.id}`} />}
    </div>
  );
}

// Reusable notes block — autosaves to localStorage via SaveManager.
export function NotesBlock({ storageKey }: { storageKey: string }) {
  const [text, setText] = useState(() => {
    try {
      return localStorage.getItem(`qc.${storageKey}`) ?? '';
    } catch {
      return '';
    }
  });

  const save = (v: string) => {
    setText(v);
    try {
      localStorage.setItem(`qc.${storageKey}`, v);
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
