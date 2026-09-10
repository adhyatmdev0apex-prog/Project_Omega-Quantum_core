// ===========================================================
// WorkspaceIframe — the reusable iframe component for standalone
// HTML labs, textbooks, ESP-32 guides, and other Quantum Core
// content.
//
// Features:
//   • fills the entire available workspace
//   • loading spinner overlay
//   • error overlay with retry
//   • forwarded ref for scroll tracking
//   • automatically remounts when src changes
// ===========================================================

import { forwardRef, useEffect, useState } from 'react';
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

export const WorkspaceIframe = forwardRef<
  HTMLIFrameElement,
  WorkspaceIframeProps
>(
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

    // Reset the loading/error state whenever the guide changes.
    useEffect(() => {
      setLoaded(false);
      setError(false);
    }, [src]);

    // Handle successful iframe loading.
    const handleLoad = (
      e: React.SyntheticEvent<HTMLIFrameElement>,
    ) => {
      setLoaded(true);
      setError(false);
      onLoad?.(e);
    };

    // Force a fresh iframe mount when retrying.
    const retry = () => {
      setLoaded(false);
      setError(false);
      setRetryKey((key) => key + 1);
    };

    return (
      <div
        className={cn(
          'relative min-h-0 min-w-0 flex-1 overflow-hidden bg-ink-950',
          className,
        )}
      >
        {/* =====================================================
            Loading overlay
            ===================================================== */}
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

        {/* =====================================================
            Error overlay
            ===================================================== */}
        {error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-ink-950">
            <GlassPanel className="max-w-md p-8 text-center">
              <Icon
                name="AlertCircle"
                size={40}
                className="mx-auto text-err-400"
              />

              <h3 className="mt-4 font-display text-lg text-white">
                Could Not Load
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                The content at{' '}
                <code className="text-xs text-cyan-400">
                  {src}
                </code>{' '}
                could not be loaded.
              </p>

              <div className="mt-6 flex justify-center">
                <NeonButton variant="ghost" onClick={retry}>
                  <Icon name="RefreshCw" size={14} />
                  Retry
                </NeonButton>
              </div>
            </GlassPanel>
          </div>
        )}

        {/* =====================================================
            HTML document

            Absolute positioning makes the iframe occupy the
            exact dimensions of this workspace container instead
            of relying on its intrinsic iframe height.
            ===================================================== */}
        <iframe
          key={`${src}-${retryKey}`}
          ref={ref}
          src={src}
          title={title}
          loading={loadingAttr}
          allow={allow}
          className={cn(
            'absolute inset-0 h-full w-full border-0',
            !loaded && 'invisible',
          )}
          onLoad={handleLoad}
          onError={() => setError(true)}
        />
      </div>
    );
  },
);