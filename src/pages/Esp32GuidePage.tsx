import { useRouter } from '../state/router';
import { WorkspaceIframe } from '../components/WorkspaceIframe';
import { Icon } from '../components/Icon';

// ===========================================================
// Esp32GuidePage — renders one ESP-32 guide file discovered from
// public/library/ESP-32/.
//
// Uses the same workspace/iframe sizing model as the working
// textbook and volume preview pages.
// ===========================================================

export function Esp32GuidePage({ slug }: { slug: string }) {
  const { navigate } = useRouter();

  const file = `/library/ESP-32/projects/${slug}.html`;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Guide navigation */}
      <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate('/library/esp32')}
          className="qc-focus flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-slate-500 hover:text-cyan-300"
        >
          <Icon
            name="ChevronRight"
            size={12}
            className="rotate-180"
          />

          ESP-32
        </button>

        <a
          href={file}
          target="_blank"
          rel="noreferrer"
          className="qc-focus flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 font-mono text-[10px] text-slate-400 hover:text-cyan-300"
        >
          <Icon name="ExternalLink" size={11} />
          New Tab
        </a>
      </div>

      {/* ESP-32 guide viewer */}
      <WorkspaceIframe
        src={file}
        title={slug}
        loading="eager"
        loadingLabel="Loading guide…"
        className="min-h-0 flex-1 rounded-2xl border border-white/10"
      />
    </div>
  );
}
