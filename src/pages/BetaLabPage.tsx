// ===========================================================
// BetaLabPage — individual experimental lab with iframe loader.
// Loads standalone HTML simulator from /public/beta/<slug>/index.html
// Feedback panel on the right side.
// ===========================================================

import { useState, useEffect } from 'react';
import { useRouter } from '../state/router';
import { GlassPanel, NeonButton, Chip } from '../components/ui';
import { FeedbackPanel } from '../components/FeedbackPanel';
import { Icon } from '../components/Icon';
import { cn } from '../lib/cn';
import { getBetaLab, type BetaLab } from '../data/betaLabs';

interface BetaLabPageProps {
  slug: string;
}

export function BetaLabPage({ slug }: BetaLabPageProps) {
  const { navigate } = useRouter();
  const [lab, setLab] = useState<BetaLab | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [showFeedback, setShowFeedback] = useState(true);

  useEffect(() => {
    const found = getBetaLab(slug);
    setLab(found ?? null);
    setIframeLoaded(false);
    setIframeError(false);
  }, [slug]);

  if (!lab) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Icon name="AlertTriangle" size={40} className="text-warn-400" />
        <h2 className="mt-4 font-display text-xl text-white">Beta Lab Not Found</h2>
        <p className="mt-2 text-sm text-slate-400">The experimental lab "{slug}" does not exist.</p>
        <NeonButton variant="ghost" onClick={() => navigate('/beta')} className="mt-6">
          <Icon name="ArrowLeft" size={14} /> Back to Beta Labs
        </NeonButton>
      </div>
    );
  }

  const simulatorSrc = `/beta/${slug}/index.html`;

  return (
    <div className="flex h-full flex-col">
      {/* Top navigation bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 bg-ink-900/40 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/beta')}
            className="qc-focus flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-slate-500 hover:text-neon-300"
          >
            <Icon name="ChevronRight" size={12} className="rotate-180" /> Beta Labs
          </button>
          <span className="hidden text-slate-700 sm:inline">/</span>
          <span className="hidden font-mono text-[11px] uppercase tracking-wider text-cyan-400 sm:inline">{lab.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <Chip variant="warn">
            <Icon name="AlertTriangle" size={10} /> Experimental
          </Chip>
          <span className="font-mono text-[10px] text-slate-600">{lab.version}</span>
          <button
            onClick={() => setShowFeedback((s) => !s)}
            className={cn(
              'qc-focus flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-[11px] transition-colors',
              showFeedback
                ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300'
                : 'border-white/10 text-slate-400 hover:text-cyan-300'
            )}
            title="Toggle feedback panel"
          >
            <Icon name="PanelRight" size={13} /> <span className="hidden sm:inline">Feedback</span>
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Simulator iframe container */}
        <div className="relative flex-1 overflow-hidden bg-ink-950">
          {/* Loading state */}
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

          {/* Error state */}
          {iframeError && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink-950">
              <GlassPanel className="max-w-md p-8 text-center">
                <Icon name="AlertCircle" size={40} className="text-err-400" />
                <h3 className="mt-4 font-display text-lg text-white">Simulator Not Found</h3>
                <p className="mt-2 text-sm text-slate-400">
                  The simulator file could not be loaded. Make sure <code className="text-cyan-400">{simulatorSrc}</code> exists.
                </p>
                <NeonButton variant="ghost" onClick={() => {
                  setIframeError(false);
                  setIframeLoaded(false);
                }} className="mt-6">
                  <Icon name="RefreshCw" size={14} /> Retry
                </NeonButton>
              </GlassPanel>
            </div>
          )}

          {/* Iframe */}
          <iframe
            src={simulatorSrc}
            title={`${lab.title} Simulator`}
            className={cn(
              'h-full w-full border-0 bg-ink-950',
              !iframeLoaded && 'invisible'
            )}
            onLoad={() => setIframeLoaded(true)}
            onError={() => setIframeError(true)}
            allow="clipboard-write; clipboard-read"
          />
        </div>

        {/* Feedback sidebar */}
        {showFeedback && (
          <div className="w-full shrink-0 overflow-y-auto border-l border-white/5 bg-ink-900/60 backdrop-blur-xl lg:w-[380px]">
            <div className="p-5">
              <FeedbackPanel lab={lab} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
