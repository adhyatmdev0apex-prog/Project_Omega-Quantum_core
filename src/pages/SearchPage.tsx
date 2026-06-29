import { useMemo, useState } from 'react';
import { useRouter } from '../state/router';
import { VOLUMES, LABS, MISSIONS, SIDEBAR_NAV } from '../data/modules';
import { GlassPanel, SectionHeader, Kbd } from '../components/ui';
import { Icon } from '../components/Icon';
import { cn } from '../lib/cn';

// ===========================================================
// Search — global search across volumes, labs, missions, pages.
// Future-compatible: add new sources to the index array.
// ===========================================================

interface SearchEntry {
  type: 'Volume' | 'Lab' | 'Mission' | 'Page';
  title: string;
  desc: string;
  icon: string;
  to: string;
  tags: string[];
}

export function SearchPage() {
  const { navigate } = useRouter();
  const [q, setQ] = useState('');

  const index: SearchEntry[] = useMemo(() => [
    ...VOLUMES.map((v) => ({ type: 'Volume' as const, title: `Volume ${v.roman}: ${v.title}`, desc: v.blurb, icon: 'BookOpen', to: `/library/${v.slug}`, tags: [v.level, 'library'] })),
    ...LABS.map((l) => ({ type: 'Lab' as const, title: l.title, desc: l.blurb, icon: l.icon, to: `/labs/${l.slug}`, tags: [...l.tags, l.category, l.difficulty] })),
    ...MISSIONS.map((m) => ({ type: 'Mission' as const, title: m.title, desc: m.briefing, icon: 'Crosshair', to: `/missions/${m.slug}`, tags: [m.difficulty, m.codename] })),
    ...SIDEBAR_NAV.map((n) => ({ type: 'Page' as const, title: n.label, desc: `Open the ${n.label} page`, icon: n.icon, to: `/${n.id}`, tags: ['page', n.id] })),
  ], []);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return index.slice(0, 6);
    return index.filter((e) =>
      e.title.toLowerCase().includes(term) ||
      e.desc.toLowerCase().includes(term) ||
      e.tags.some((t) => t.toLowerCase().includes(term)),
    );
  }, [q, index]);

  const typeColor: Record<string, 'neon' | 'cyan' | 'warn' | 'default'> = {
    Volume: 'neon', Lab: 'cyan', Mission: 'warn', Page: 'default',
  };

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Global" title="Search" description="Search across every volume, lab, mission, and page." />

      <div className="relative">
        <Icon name="Search" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search modules, labs, missions…"
          className="qc-focus w-full rounded-xl border border-white/10 bg-white/[0.03] py-3.5 pl-12 pr-4 font-mono text-sm text-white outline-none placeholder:text-slate-600 focus:border-neon-400/40"
        />
      </div>

      <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
        <Kbd>⌘</Kbd><Kbd>K</Kbd> <span>opens search · {results.length} results</span>
      </div>

      <div className="space-y-2">
        {results.map((r, i) => (
          <button key={i} onClick={() => navigate(r.to)} className="qc-focus block w-full text-left">
            <GlassPanel className="group flex items-center gap-4 p-4" hover>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]">
                <Icon name={r.icon} size={18} className="text-neon-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-200">{r.title}</span>
                  <span className={cn('chip', typeColor[r.type] === 'neon' ? 'chip-neon' : typeColor[r.type] === 'cyan' ? 'chip-cyan' : typeColor[r.type] === 'warn' ? 'chip-warn' : '')}>{r.type}</span>
                </div>
                <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">{r.desc}</p>
              </div>
              <Icon name="ArrowRight" size={14} className="shrink-0 text-slate-600 opacity-0 transition-opacity group-hover:opacity-100" />
            </GlassPanel>
          </button>
        ))}
        {results.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/10 px-6 py-12 text-center text-sm text-slate-500">
            No matches for “{q}”.
          </div>
        )}
      </div>
    </div>
  );
}
