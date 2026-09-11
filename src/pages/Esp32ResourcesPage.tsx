import { useEffect, useState } from 'react';
import { useRouter } from '../state/router';
import {
  SectionHeader,
  EmptyState,
  GlassPanel,
  Chip,
  NeonButton,
} from '../components/ui';
import { Icon } from '../components/Icon';

// ===========================================================
// ESP-32 Resources — discovers every file under
// public/library/ESP-32/resources/ through a generated manifest.
// ===========================================================

interface Esp32Resource {
  slug: string;
  title: string;
  file: string;
  type: 'image' | 'video' | 'audio' | 'pdf' | 'archive' | 'code' | 'file';
  extension: string;
  size: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function resourceIcon(resource: Esp32Resource): string {
  switch (resource.type) {
    case 'image':
      return 'Image';
    case 'video':
      return 'Play';
    case 'audio':
      return 'Volume2';
    case 'pdf':
      return 'FileText';
    case 'archive':
      return 'Archive';
    case 'code':
      return 'Code2';
    default:
      return 'FileText';
  }
}

export function Esp32ResourcesPage() {
  const { navigate } = useRouter();
  const [resources, setResources] = useState<Esp32Resource[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch('/library/ESP-32/resources/manifest.json')
      .then((response) => (response.ok ? response.json() : []))
      .then((data: Esp32Resource[]) => {
        if (!cancelled) {
          setResources(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (!cancelled) setResources([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Knowledge Base / ESP-32 / Resources"
        title="Resources"
        description="Reference material placed in public/library/ESP-32/resources/ is discovered automatically and shown here."
      />

      {resources === null ? (
        <div className="py-16 text-center font-mono text-[11px] uppercase tracking-wider text-slate-500">
          Loading resources…
        </div>
      ) : resources.length === 0 ? (
        <EmptyState
          icon={<Icon name="Folder" size={40} />}
          title="Resource library is empty"
          description="Add images, videos, PDFs, ZIPs, code files, datasheets, or other reference material to public/library/ESP-32/resources/."
          action={
            <NeonButton variant="cyan" onClick={() => navigate('/library/esp32')}>
              <Icon name="ArrowLeft" size={14} /> Back to ESP-32
            </NeonButton>
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <GlassPanel
              key={resource.slug}
              variant={
                resource.type === 'image' || resource.type === 'video'
                  ? 'cyan'
                  : 'default'
              }
              className="group overflow-hidden p-0"
              hover
            >
              {resource.type === 'image' && (
                <div className="flex h-44 items-center justify-center overflow-hidden border-b border-white/5 bg-black/40">
                  <img
                    src={resource.file}
                    alt={resource.title}
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                </div>
              )}

              {resource.type === 'video' && (
                <div className="border-b border-white/5 bg-black/40">
                  <video
                    className="h-44 w-full object-contain"
                    controls
                    preload="metadata"
                  >
                    <source src={resource.file} />
                  </video>
                </div>
              )}

              {resource.type === 'audio' && (
                <div className="flex h-28 items-center justify-center border-b border-white/5 bg-black/40 px-5">
                  <audio className="w-full" controls preload="metadata">
                    <source src={resource.file} />
                  </audio>
                </div>
              )}

              {resource.type !== 'image' &&
                resource.type !== 'video' &&
                resource.type !== 'audio' && (
                  <div className="relative flex h-28 items-center justify-center overflow-hidden border-b border-white/5 bg-gradient-to-br from-neon-400/10 via-ink-850 to-ink-900">
                    <div className="absolute inset-0 bg-grid-faint bg-grid opacity-30" />
                    <Icon
                      name={resourceIcon(resource)}
                      size={48}
                      className="relative text-neon-400/70"
                    />
                  </div>
                )}

              <div className="p-4">
                <h3 className="font-display text-base font-bold text-white">
                  {resource.title}
                </h3>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Chip variant="neon">{resource.type}</Chip>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-slate-600">
                    {resource.extension || 'file'}
                  </span>
                  {resource.size > 0 && (
                    <span className="font-mono text-[10px] text-slate-600">
                      {formatBytes(resource.size)}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span
                    className="truncate pr-3 font-mono text-[10px] text-slate-600"
                    title={resource.slug}
                  >
                    {resource.slug}
                  </span>
                  <a
                    href={resource.file}
                    target="_blank"
                    rel="noreferrer"
                    className="flex shrink-0 items-center gap-1 font-mono text-[11px] text-neon-300 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    Open <Icon name="ExternalLink" size={12} />
                  </a>
                </div>
              </div>
            </GlassPanel>
          ))}
        </div>
      )}
    </div>
  );
}
