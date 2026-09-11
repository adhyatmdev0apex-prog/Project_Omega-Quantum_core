import { useEffect, useState } from 'react';
import { useRouter } from '../state/router';
import { SectionHeader, EmptyState, GlassPanel, Chip, NeonButton } from '../components/ui';
import { Icon } from '../components/Icon';

interface Esp32Guide {
  slug: string;
  title: string;
  file: string;
}

interface Esp32Resource {
  name: string;
  title: string;
  file: string;
  type: string;
  extension: string;
  size: number;
}

type Esp32LibraryMode = 'home' | 'projects' | 'resources';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function resourceIcon(type: string): string {
  switch (type) {
    case 'image': return 'Image';
    case 'video': return 'Play';
    case 'audio': return 'Volume2';
    case 'pdf': return 'FileText';
    case 'archive': return 'Archive';
    case 'code': return 'Code2';
    default: return 'Box';
  }
}

export function Esp32LibraryPage({ mode = 'home' }: { mode?: Esp32LibraryMode }) {
  const { navigate } = useRouter();
  const [guides, setGuides] = useState<Esp32Guide[] | null>(null);
  const [resources, setResources] = useState<Esp32Resource[] | null>(null);

  useEffect(() => {
    if (mode !== 'projects') return;
    let cancelled = false;
    fetch('/library/ESP-32/projects/manifest.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Esp32Guide[]) => {
        if (!cancelled) setGuides(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setGuides([]);
      });
    return () => { cancelled = true; };
  }, [mode]);

  useEffect(() => {
    if (mode !== 'resources') return;
    let cancelled = false;
    fetch('/library/ESP-32/resources/manifest.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Esp32Resource[]) => {
        if (!cancelled) setResources(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setResources([]);
      });
    return () => { cancelled = true; };
  }, [mode]);

  if (mode === 'home') {
    return (
      <div className="space-y-8">
        <SectionHeader
          eyebrow="Knowledge Base / ESP-32"
          title="ESP-32"
          description="Choose how you want to explore the embedded systems library."
        />

        <div className="grid gap-5 md:grid-cols-2">
          <GlassPanel
            variant="cyan"
            className="group cursor-pointer overflow-hidden p-0"
            hover
            onClick={() => navigate('/library/esp32/projects')}
          >
            <div className="relative h-36 overflow-hidden border-b border-white/5 bg-gradient-to-br from-cyan-400/15 via-ink-850 to-ink-900">
              <div className="absolute inset-0 bg-grid-faint bg-grid opacity-40" />
              <div className="absolute right-5 top-5 opacity-25">
                <Icon name="Cpu" size={64} className="text-cyan-400" />
              </div>
              <div className="absolute bottom-4 left-5">
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-400">ESP-32 Library</div>
                <h3 className="font-display text-2xl font-bold text-white">Projects</h3>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-400">The complete ESP32 hands-on project sequence and the exact interactive HTML guides.</p>
              <div className="mt-5 flex items-center justify-between">
                <Chip variant="cyan">Guides</Chip>
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
            <div className="relative h-36 overflow-hidden border-b border-white/5 bg-gradient-to-br from-neon-400/10 via-ink-850 to-ink-900">
              <div className="absolute inset-0 bg-grid-faint bg-grid opacity-40" />
              <div className="absolute right-5 top-5 opacity-25">
                <Icon name="Archive" size={64} className="text-neon-400" />
              </div>
              <div className="absolute bottom-4 left-5">
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-400">ESP-32 Library</div>
                <h3 className="font-display text-2xl font-bold text-white">Resources</h3>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-400">Reference images, code archives, PDFs, videos, audio, and any other learning material you add.</p>
              <div className="mt-5 flex items-center justify-between">
                <Chip variant="neon">Open Files</Chip>
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

  if (mode === 'projects') {
    return (
      <div className="space-y-8">
        <SectionHeader
          eyebrow="Knowledge Base / ESP-32 / Projects"
          title="Projects"
          description="The existing ESP32 project guides, discovered automatically from public/library/ESP-32/projects/."
          action={
            <NeonButton variant="ghost" onClick={() => navigate('/library/esp32')}>
              <Icon name="ArrowLeft" size={14} /> ESP-32
            </NeonButton>
          }
        />

        {guides === null ? (
          <div className="py-16 text-center font-mono text-[11px] uppercase tracking-wider text-slate-500">
            Loading projects…
          </div>
        ) : guides.length === 0 ? (
          <EmptyState
            icon={<Icon name="Cpu" size={40} />}
            title="No ESP-32 projects found"
            description="Drop your existing .html project guides into public/library/ESP-32/projects/ and they will appear here automatically."
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {guides.map((g) => (
              <GlassPanel
                key={g.slug}
                variant="cyan"
                className="group cursor-pointer overflow-hidden p-0"
                hover
                onClick={() => navigate(`/library/esp32/projects/${encodeURIComponent(g.slug)}`)}
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

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Knowledge Base / ESP-32 / Resources"
        title="Resources"
        description="Everything you place inside public/library/ESP-32/resources/ appears here automatically."
        action={
          <NeonButton variant="ghost" onClick={() => navigate('/library/esp32')}>
            <Icon name="ArrowLeft" size={14} /> ESP-32
          </NeonButton>
        }
      />

      {resources === null ? (
        <div className="py-16 text-center font-mono text-[11px] uppercase tracking-wider text-slate-500">
          Loading resources…
        </div>
      ) : resources.length === 0 ? (
        <EmptyState
          icon={<Icon name="Archive" size={40} />}
          title="No resources yet"
          description="Drop images, code archives, PDFs, videos, audio, or other learning files into public/library/ESP-32/resources/ and they will appear here automatically."
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <GlassPanel key={resource.name} className="group overflow-hidden p-0" hover>
              <a href={resource.file} target="_blank" rel="noreferrer" className="block">
                <div className="relative flex h-24 items-center justify-center border-b border-white/5 bg-gradient-to-br from-neon-400/10 via-ink-850 to-ink-900">
                  <div className="absolute inset-0 bg-grid-faint bg-grid opacity-30" />
                  <Icon name={resourceIcon(resource.type)} size={38} className="relative text-neon-300" />
                </div>
                <div className="p-4">
                  <h3 className="font-display text-base font-bold text-white">{resource.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Chip variant="neon">{resource.extension || 'FILE'}</Chip>
                    <span className="font-mono text-[10px] text-slate-500">{formatBytes(resource.size)}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{resource.type}</span>
                    <span className="flex items-center gap-1 font-mono text-[11px] text-neon-300 opacity-0 transition-opacity group-hover:opacity-100">
                      Open <Icon name="ExternalLink" size={11} />
                    </span>
                  </div>
                </div>
              </a>
            </GlassPanel>
          ))}
        </div>
      )}
    </div>
  );
}
