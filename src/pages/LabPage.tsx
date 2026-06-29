import { useRouter } from '../state/router';
import { useProgress } from '../state/progress';
import { LABS } from '../data/modules';
import { GlassPanel, NeonButton, Chip, SectionHeader, EmptyState, ProgressBar } from '../components/ui';
import { Icon } from '../components/Icon';
import { Terminal } from '../components/Terminal';
import { NotesBlock } from './TextbookPage';
import { cn } from '../lib/cn';

// ===========================================================
// LabPage — reusable lab template. Objectives, terminal demo,
// progress, notes. Marking complete awards XP.
// ===========================================================

export function LabPage({ slug }: { slug: string }) {
  const { navigate } = useRouter();
  const { completeLab, state } = useProgress();
  const lab = LABS.find((l) => l.slug === slug);

  if (!lab) {
    return (
      <EmptyState
        icon={<Icon name="FlaskConical" size={32} />}
        title="Lab not found"
        action={<NeonButton variant="ghost" onClick={() => navigate('/labs')}>Back to Labs</NeonButton>}
      />
    );
  }

  const done = state.completedLabs.includes(lab.id);
  const objectives = [
    `Set up the ${lab.title} environment`,
    `Complete the guided walkthrough`,
    `Attempt the challenge unaided`,
    `Document findings in your notebook`,
  ];

  return (
    <div className="space-y-8">
      <button onClick={() => navigate('/labs')} className="qc-focus flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-slate-500 hover:text-neon-300">
        <Icon name="ChevronRight" size={12} className="rotate-180" /> Labs
      </button>

      {/* Header */}
      <GlassPanel className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-neon-400/30 bg-neon-400/10">
              <Icon name={lab.icon} size={26} className="text-neon-400" />
            </div>
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-400">{lab.category}</div>
              <h1 className="mt-0.5 font-display text-3xl font-bold text-white text-glow">{lab.title}</h1>
              <p className="mt-1 max-w-xl text-sm text-slate-400">{lab.blurb}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Chip variant="neon">{lab.difficulty}</Chip>
                <Chip><Icon name="Clock" size={11} /> {lab.estMinutes} min</Chip>
                {done && <Chip variant="cyan"><Icon name="CheckCircle2" size={11} /> Complete</Chip>}
              </div>
            </div>
          </div>
          <NeonButton disabled={done} onClick={() => completeLab(lab.id)}>
            <Icon name="CheckCircle2" size={14} /> {done ? 'Completed' : 'Mark Complete'}
          </NeonButton>
        </div>
      </GlassPanel>

      {/* Objectives */}
      <section>
        <SectionHeader eyebrow="Checklist" title="Lab Objectives" />
        <GlassPanel className="mt-4 p-5">
          <ol className="space-y-3">
            {objectives.map((o, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[11px]', done ? 'border-neon-400/40 bg-neon-400/10 text-neon-300' : 'border-white/10 text-slate-500')}>
                  {done ? <Icon name="CheckCircle2" size={14} /> : i + 1}
                </span>
                <span className="text-sm text-slate-300">{o}</span>
              </li>
            ))}
          </ol>
          <div className="mt-5">
            <div className="mb-1.5 flex justify-between font-mono text-[11px] text-slate-500">
              <span>Progress</span><span>{done ? 100 : 0}%</span>
            </div>
            <ProgressBar value={done ? 100 : 0} />
          </div>
        </GlassPanel>
      </section>

      {/* Terminal demo */}
      <section>
        <SectionHeader eyebrow="Demo" title="Terminal Walkthrough" />
        <div className="mt-4">
          <Terminal
            title={`${lab.slug}@quantum-core`}
            typed
            lines={[
              { prompt: '$', text: `echo "Starting ${lab.title} lab"`, kind: 'cmd' },
              { text: `Starting ${lab.title} lab`, kind: 'out' },
              { prompt: '$', text: 'lab --status', kind: 'cmd' },
              { text: 'environment: ready', kind: 'ok' },
              { text: 'objectives: 0/4', kind: 'out' },
              { prompt: '$', text: '_', kind: 'cmd' },
            ]}
          />
        </div>
      </section>

      <NotesBlock storageKey={`notes.lab.${lab.id}`} />
    </div>
  );
}
