// ===========================================================
// BetaLabPage — generic iframe viewer for any beta project.
// Loads /beta-projects/<slug>/index.html. Metadata is fetched
// from the auto-generated manifest — no hardcoding.
// ===========================================================

import { useState, useEffect } from 'react';
import { useRouter } from '../state/router';
import { GlassPanel, NeonButton, Chip } from '../components/ui';
import { FeedbackPanel } from '../components/FeedbackPanel';
import { Icon } from '../components/Icon';
import { cn } from '../lib/cn';
import { betaProjectUrl, type BetaProject } from '../data/betaLabs';

interface BetaLabPageProps {
  slug: string;
}

const DEFAULT_PROJECT = (slug: string): BetaProject => ({
  slug,
  title: slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  description: '',
  version: 'v0.1 Alpha',
  status: 'experimental',
  progress: 0,
  icon: 'FlaskConical',
  tags: [],
});

export function BetaLabPage({ slug }: BetaLabPageProps) {
  const { navigate } = useRouter();
  const [project, setProject] = useState<BetaProject>(DEFAULT_PROJECT(slug));
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [showFeedback, setShowFeedback] = useState(true);

  // Fetch project metadata from the shared manifest
  useEffect(() => {
    setIframeLoaded(false);
    setIframeError(false);
    setProject(DEFAULT_PROJECT(slug));

    fetch('/beta-projects/manifest.json')
      .then((r) => r.ok ? r.json() : [])
      .then((list: BetaProject[]) => {
        const found = list.find((p) => p.slug === slug);
        if (found) setProject(found);
      })
      .catch(() => { /* keep defaults */ });
  }, [slug]);

  const simulatorSrc = betaProjectUrl(slug);

  return (
    <div className="flex h-full flex-col">
      {/* Navigation bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 bg-ink-900/40 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/beta')}
            className="qc-focus flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-slate-500 hover:text-neon-300"
          >
            <Icon name="ChevronRight" size={12} className="rotate-180" /> Beta Labs
          </button>
          <span className="hidden text-slate-700 sm:inline">/</span>
          <span className="hidden font-mono text-[11px] uppercase tracking-wider text-cyan-400 sm:inline">
            {project.title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Chip variant="warn">
            <Icon name="AlertTriangle" size={10} /> Experimental
          </Chip>
          <span className="font-mono text-[10px] text-slate-600">{project.version}</span>
          <button
            onClick={() => setShowFeedback((s) => !s)}
            className={cn(
              'qc-focus flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-[11px] transition-colors',
              showFeedback
                ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300'
                : 'border-white/10 text-slate-400 hover:text-cyan-300',
            )}
            title="Toggle feedback panel"
          >
            <Icon name="PanelRight" size={13} />
            <span className="hidden sm:inline">Feedback</span>
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Simulator iframe */}
        <div className="relative flex-1 overflow-hidden bg-ink-950">
          {/* Loading */}
          {!iframeLoaded && !iframeError && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink-950">
              <div className="flex flex-col items-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-400/30 border-t-neon-400" />
                <span className="mt-4 font-mono text-[11px] uppercase tracking-wider text-slate-500">
                  Loading simulator...
                </span>
              </div>
            </div>
          )}

          {/* Error */}
          {iframeError && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink-950">
              <GlassPanel className="max-w-md p-8 text-center">
                <Icon name="AlertCircle" size={40} className="text-err-400" />
                <h3 className="mt-4 font-display text-lg text-white">Simulator Not Found</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Drop your simulator at{' '}
                  <code className="text-cyan-400">{simulatorSrc}</code> and it will load automatically.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <NeonButton variant="ghost" onClick={() => navigate('/beta')}>
                    <Icon name="ArrowLeft" size={14} /> Back
                  </NeonButton>
                  <NeonButton variant="ghost" onClick={() => {
                    setIframeError(false);
                    setIframeLoaded(false);
                  }}>
                    <Icon name="RefreshCw" size={14} /> Retry
                  </NeonButton>
                </div>
              </GlassPanel>
            </div>
          )}
      

         <div className="h-full w-full">
  <iframe
    key={slug}
    src={simulatorSrc}
    title={`${project.title} — Beta`}
    className={cn(
      "w-full h-full border-0 bg-ink-950",
      !iframeLoaded && "invisible"
    )}
    onLoad={() => setIframeLoaded(true)}
    onError={() => setIframeError(true)}
    allow="clipboard-write; clipboard-read"
  />
</div>
    </div>

        {/* Feedback sidebar */}
        {showFeedback && (
          <div className="w-full shrink-0 overflow-y-auto border-l border-white/5 bg-ink-900/60 backdrop-blur-xl lg:w-[380px]">
            <div className="p-5">
              <FeedbackPanel project={project} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
