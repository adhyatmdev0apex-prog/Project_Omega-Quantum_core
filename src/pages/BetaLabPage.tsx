// ===========================================================
// BetaLabPage — generic workspace viewer for any beta project.
// AppShell renders this in workspace mode (no max-w, no padding).
// WorkspaceIframe fills all available space; the left sidebar
// collapse directly expands the iframe via flex.
// ===========================================================

import { useState, useEffect } from 'react';
import { useRouter } from '../state/router';
import { GlassPanel, NeonButton, Chip } from '../components/ui';
import { FeedbackPanel } from '../components/FeedbackPanel';
import { WorkspaceIframe } from '../components/WorkspaceIframe';
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
  const [showFeedback, setShowFeedback] = useState(true);

  // Fetch project metadata from the auto-generated manifest
  useEffect(() => {
    setProject(DEFAULT_PROJECT(slug));
    fetch('/beta-projects/manifest.json')
      .then((r) => r.ok ? r.json() : [])
      .then((list: BetaProject[]) => {
        const found = list.find((p) => p.slug === slug);
        if (found) setProject(found);
      })
      .catch(() => { /* keep defaults */ });
  }, [slug]);

  return (
    // h-full fills the AppShell workspace main area (flex-1 overflow-hidden flex flex-col)
    <div className="flex h-full flex-col">
      {/* Top navigation bar */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/5 bg-ink-900/60 px-4 py-2.5 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/beta')}
            className="qc-focus flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-slate-500 hover:text-neon-300"
          >
            <Icon name="ChevronRight" size={12} className="rotate-180" />
            Beta Labs
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

      {/* Workspace area — iframe + optional feedback sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* The iframe fills all remaining space. When the left sidebar or
            feedback panel collapses, flex-1 immediately expands to fill it. */}
        <WorkspaceIframe
          src={betaProjectUrl(slug)}
          title={project.title}
          loadingLabel="Loading simulator…"
          className="flex-1"
        />

        {/* Feedback sidebar — collapsible */}
        {showFeedback && (
          <aside className="flex w-full shrink-0 flex-col overflow-y-auto border-l border-white/5 bg-ink-900/60 backdrop-blur-xl lg:w-[380px]">
            {/* Sidebar header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-5 py-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
                Feedback
              </span>
              <button
                onClick={() => setShowFeedback(false)}
                className="rounded-lg p-1 text-slate-500 hover:text-slate-300"
                title="Close feedback panel"
              >
                <Icon name="X" size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <FeedbackPanel project={project} />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
