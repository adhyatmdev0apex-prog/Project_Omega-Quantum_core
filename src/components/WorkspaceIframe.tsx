// ===========================================================
// WorkspaceIframe — the ONE reusable iframe component for every
// standalone HTML lab in Quantum Core.
//
// Used by: BetaLabPage, TextbookPage.
// Features:
//   • fills 100% of its container (no fixed sizes)
//   • loading spinner overlay
//   • error overlay with retry
//   • forwarded ref (for scroll tracking in TextbookPage)
//   • auto-remounts when src changes
// ===========================================================

import { forwardRef, useState, useEffect } from 'react';
import { Icon } from './Icon';
import { GlassPanel, NeonButton } from './ui';
import { cn } from '../lib/cn';

export interface WorkspaceIframeProps {
  src: string;
  title: string;
  className?: string;
  onLoad?: (e: React.SyntheticEvent<HTMLIFrameElement>) => void;
  allow?: string;
  loading?: 'lazy' | 'eager';
  loadingLabel?: string;
}

export const WorkspaceIframe = forwardRef<HTMLIFrameElement, WorkspaceIframeProps>(
  function WorkspaceIframe(
    {
      src,
      title,
      className,
      onLoad,
      allow = 'clipboard-write; clipboard-read',
      loading: loadingAttr = 'eager',
      loadingLabel = 'Loading…',
    },
    ref,
  ) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const [retryKey, setRetryKey] = useState(0);

    // Reset loading state when the src changes (e.g. volume navigation)
    useEffect(() => {
      setLoaded(false);
      setError(false);
    }, [src]);

    const handleLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
      setLoaded(true);
      onLoad?.(e);
    };

    const retry = () => {
      setError(false);
      setLoaded(false);
      setRetryKey((k) => k + 1);
    };

    return (
      <div className={cn('relative overflow-hidden bg-ink-950', className)}>
        {/* Loading overlay */}
        {!loaded && !error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-ink-950">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-400/30 border-t-neon-400" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                {loadingLabel}
              </span>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-ink-950">
            <GlassPanel className="max-w-md p-8 text-center">
              <Icon name="AlertCircle" size={40} className="mx-auto text-err-400" />
              <h3 className="mt-4 font-display text-lg text-white">Could Not Load</h3>
              <p className="mt-2 text-sm text-slate-400">
                The content at{' '}
                <code className="text-xs text-cyan-400">{src}</code>{' '}
                could not be loaded.
              </p>
              <div className="mt-6 flex justify-center">
                <NeonButton variant="ghost" onClick={retry}>
                  <Icon name="RefreshCw" size={14} /> Retry
                </NeonButton>
              </div>
            </GlassPanel>
          </div>
        )}

        <iframe
          key={`${src}-${retryKey}`}
          ref={ref}
          src={src}
          title={title}
          loading={loadingAttr}
          allow={allow}
          className={cn('h-full w-full border-0', !loaded && 'invisible')}
          onLoad={handleLoad}
          onError={() => setError(true)}
        />
      </div>
    );
  },
);
