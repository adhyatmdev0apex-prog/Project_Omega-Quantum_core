import { useState } from 'react';
import { useRouter } from '../state/router';
import { useProgress } from '../state/progress';
import { VOLUMES } from '../data/modules';
import { GlassPanel, NeonButton, Chip, SectionHeader, EmptyState } from '../components/ui';
import { Icon } from '../components/Icon';
import { Terminal } from '../components/Terminal';
import { cn } from '../lib/cn';

// ===========================================================
// TextbookPage — the shared layout every volume uses.
// Cover · TOC · Chapters · Modules · Callouts · Terminal ·
// Flow diagram · Mission box · TLDR · Notes.
// Content is structural scaffolding only — no textbook prose.
// ===========================================================

export function TextbookPage({ slug }: { slug: string }) {
  const { navigate } = useRouter();
  const { completeVolume } = useProgress();
  const volume = VOLUMES.find((v) => v.slug === slug);

  if (!volume) {
    return (
      <EmptyState
        icon={<Icon name="BookOpen" size={32} />}
        title="Volume not found"
        description="This volume hasn’t been registered yet."
        action={<NeonButton variant="ghost" onClick={() => navigate('/library')}>Back to Library</NeonButton>}
      />
    );
  }

  const accent = volume.accent;
  const chapters = Array.from({ length: volume.chapters }, (_, i) => ({
    n: i + 1,
    title: `Chapter ${i + 1}`,
    modules: 3,
  }));

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <button onClick={() => navigate('/library')} className="qc-focus flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-slate-500 hover:text-neon-300">
        <Icon name="ChevronRight" size={12} className="rotate-180" /> Library
      </button>

      {/* Cover */}
      <GlassPanel variant={accent === 'cyan' ? 'cyan' : 'default'} className="relative overflow-hidden p-0">
        <div className={cn('relative h-48 overflow-hidden border-b border-white/5', accent === 'neon' ? 'bg-gradient-to-br from-neon-400/15 via-ink-850 to-ink-900' : 'bg-gradient-to-br from-cyan-400/15 via-ink-850 to-ink-900')}>
          <div className="absolute inset-0 bg-grid-faint bg-grid opacity-40" />
          <div className="absolute right-8 top-6 font-display text-7xl font-bold opacity-20" style={{ color: accent === 'neon' ? '#39ff14' : '#00f0ff' }}>
            {volume.roman}
          </div>
          <div className="absolute bottom-6 left-8">
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-400">Volume {volume.roman}</div>
            <h1 className="mt-1 font-display text-4xl font-bold text-white text-glow">{volume.title}</h1>
            <p className="mt-1 text-sm text-slate-400">{volume.subtitle}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 p-5">
          <Chip variant={accent === 'neon' ? 'neon' : 'cyan'}>{volume.level}</Chip>
          <Chip><Icon name="BookOpen" size={11} /> {volume.chapters} chapters</Chip>
          <Chip><Icon name="Clock" size={11} /> {volume.estHours}h est.</Chip>
          <NeonButton variant={accent === 'cyan' ? 'cyan' : 'neon'} className="ml-auto" onClick={() => completeVolume(volume.id)}>
            <Icon name="CheckCircle2" size={14} /> Mark Complete
          </NeonButton>
        </div>
      </GlassPanel>

      {/* TLDR */}
      <GlassPanel className="p-5">
        <div className="section-eyebrow mb-2">TL;DR</div>
        <p className="text-sm leading-relaxed text-slate-300">{volume.blurb}</p>
      </GlassPanel>

      {/* Table of contents */}
      <section>
        <SectionHeader eyebrow="Contents" title="Table of Contents" />
        <GlassPanel className="mt-4 divide-y divide-white/5 p-0">
          {chapters.map((c) => (
            <div key={c.n} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.02]">
              <span className={cn('font-mono text-sm font-bold', accent === 'neon' ? 'text-neon-400' : 'text-cyan-400')}>
                {String(c.n).padStart(2, '0')}
              </span>
              <span className="flex-1 text-sm text-slate-200">{c.title}</span>
              <span className="font-mono text-[11px] text-slate-500">{c.modules} modules</span>
              <Icon name="ChevronRight" size={14} className="text-slate-600" />
            </div>
          ))}
        </GlassPanel>
      </section>

      {/* Chapter scaffolding — reusable building blocks */}
      <section className="space-y-6">
        <SectionHeader eyebrow="Chapter 01" title="Sample Chapter Structure" description="The reusable blocks every chapter is built from." />

        {/* Callouts */}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="callout callout-info">
            <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-cyan-300">Info</div>
            <p>Contextual notes and definitions live here.</p>
          </div>
          <div className="callout callout-note">
            <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-neon-300">Pro Tip</div>
            <p>Operator notes and field-tested shortcuts.</p>
          </div>
          <div className="callout callout-warn">
            <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-warn-400">Warning</div>
            <p>Common pitfalls and footguns to avoid.</p>
          </div>
          <div className="callout callout-danger">
            <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-err-400">Danger</div>
            <p>Operations that can destroy data or expose systems.</p>
          </div>
        </div>

        {/* Terminal example */}
        <Terminal
          title="chapter-01.example"
          lines={[
            { prompt: '$', text: 'whoami', kind: 'cmd' },
            { text: 'operator', kind: 'out' },
            { prompt: '$', text: 'uname -a', kind: 'cmd' },
            { text: 'Linux quantum-core 6.9.12 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux', kind: 'out' },
          ]}
        />

        {/* Flow diagram */}
        <FlowDiagram accent={accent} />

        {/* Mission box */}
        <MissionBox accent={accent} />
      </section>

      {/* Notes */}
      <NotesBlock storageKey={`notes.vol.${volume.id}`} />
    </div>
  );
}

function FlowDiagram({ accent }: { accent: 'neon' | 'cyan' }) {
  const steps = ['Recon', 'Enumerate', 'Exploit', 'Escalate', 'Report'];
  const color = accent === 'neon' ? 'text-neon-400 border-neon-400/30 bg-neon-400/5' : 'text-cyan-400 border-cyan-400/30 bg-cyan-400/5';
  return (
    <GlassPanel className="p-5">
      <div className="section-eyebrow mb-3">Flow Diagram</div>
      <div className="flex flex-wrap items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span className={cn('rounded-lg border px-3 py-2 font-mono text-xs', color)}>{s}</span>
            {i < steps.length - 1 && <Icon name="ArrowRight" size={14} className="text-slate-600" />}
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

function MissionBox({ accent }: { accent: 'neon' | 'cyan' }) {
  const { navigate } = useRouter();
  return (
    <GlassPanel variant={accent === 'cyan' ? 'cyan' : 'default'} className="p-5">
      <div className="flex items-start gap-3">
        <Icon name="Crosshair" size={20} className={accent === 'neon' ? 'text-neon-400' : 'text-cyan-400'} />
        <div className="flex-1">
          <div className="section-eyebrow mb-1">Mission Box</div>
          <p className="text-sm text-slate-300">Apply this chapter’s material in a hands-on operation.</p>
          <NeonButton variant={accent === 'cyan' ? 'cyan' : 'neon'} className="mt-3" onClick={() => navigate('/missions')}>
            <Icon name="Play" size={14} /> View Missions
          </NeonButton>
        </div>
      </div>
    </GlassPanel>
  );
}

// Reusable notes block — autosaves to localStorage.
export function NotesBlock({ storageKey }: { storageKey: string }) {
  const [text, setText] = useState(() => {
    try { return localStorage.getItem(storageKey) ?? ''; } catch { return ''; }
  });

  const save = (v: string) => {
    setText(v);
    try { localStorage.setItem(storageKey, v); } catch { /* ignore */ }
  };

  return (
    <GlassPanel className="p-5">
      <div className="mb-2 flex items-center justify-between">
        <div className="section-eyebrow">Operator Notes</div>
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-neon-400">
          <Icon name="Save" size={11} /> autosaved
        </span>
      </div>
      <textarea
        value={text}
        onChange={(e) => save(e.target.value)}
        placeholder="Notes autosave locally as you type…"
        className="qc-focus h-40 w-full resize-none rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-[13px] text-slate-200 placeholder:text-slate-600 focus:border-neon-400/40"
      />
    </GlassPanel>
  );
}
