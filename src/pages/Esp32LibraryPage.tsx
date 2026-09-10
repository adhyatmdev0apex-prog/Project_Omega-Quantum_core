import { useEffect, useState } from 'react';
import { useRouter } from '../state/router';
import { SectionHeader, EmptyState, GlassPanel, Chip, NeonButton } from '../components/ui';
import { Icon } from '../components/Icon';

// ===========================================================
// ESP-32 category content. Separate from the Cyber Security
// curriculum entirely — no shared data. Guides are discovered
// automatically from public/library/ESP-32/manifest.json, which
// vite.config.ts's esp32LibraryPlugin regenerates from whatever
// .html files sit in that folder (dev + build). Adding a guide
// = dropping a file there; no React/TS edits required.
// ===========================================================

interface Esp32Guide {
  slug: string;
  title: string;
  file: string;
}

export function Esp32LibraryPage() {
  const { navigate } = useRouter();
  const [guides, setGuides] = useState<Esp32Guide[] | null>(null); // null = loading

  useEffect(() => {
    let cancelled = false;
    fetch('/library/ESP-32/manifest.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Esp32Guide[]) => { if (!cancelled) setGuides(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setGuides([]); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Knowledge Base / ESP-32"
        title="ESP-32"
        description="Embedded systems curriculum — microcontroller fundamentals, firmware, and hands-on builds."
      />

      {guides === null ? (
        <div className="py-16 text-center font-mono text-[11px] uppercase tracking-wider text-slate-500">
          Loading guides…
        </div>
      ) : guides.length === 0 ? (
        <EmptyState
          icon={<Icon name="Cpu" size={40} />}
          title="ESP-32 material is on the way"
          description="Drop an .html guide into public/library/ESP-32/ and it will appear here automatically — no code changes needed."
          action={
            <NeonButton variant="cyan" onClick={() => navigate('/library')}>
              <Icon name="ArrowLeft" size={14} /> Back to Library
            </NeonButton>
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {guides.map((g) => (
            <GlassPanel
              key={g.slug}
              variant="cyan"
              className="group cursor-pointer overflow-hidden p-0"
              hover
              onClick={() => navigate(`/library/esp32/${encodeURIComponent(g.slug)}`)}
            >
              <div className="relative h-24 overflow-hidden border-b border-white/5 bg-gradient-to-br from-cyan-400/15 via-ink-850 to-ink-900">
                <div className="absolute inset-0 bg-grid-faint bg-grid opacity-40" />
                <div className="absolute right-4 top-4 opacity-30">
                  <Icon name="Cpu" size={32} className="text-cyan-400" />
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-display text-base font-bold text-white">{g.title}</h3>
                <div className="mt-3 flex items-center justify-between">
                  <Chip variant="cyan">Guide</Chip>
                  <span className="flex items-center gap-1 font-mono text-[11px] text-cyan-300 opacity-0 transition-opacity group-hover:opacity-100">
                    Open <Icon name="ArrowRight" size={12} />
                  </span>
                </div>
              </div>
            </GlassPanel>
          ))}
        </div>
      )}
    </div>
  );
}
