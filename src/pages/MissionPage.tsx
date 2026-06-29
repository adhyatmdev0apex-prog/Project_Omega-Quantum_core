import { useRouter } from '../state/router';
import { useProgress } from '../state/progress';
import { MISSIONS } from '../data/modules';
import { GlassPanel, NeonButton, Chip, SectionHeader, EmptyState, ProgressBar } from '../components/ui';
import { Icon } from '../components/Icon';
import { Terminal } from '../components/Terminal';
import { NotesBlock } from './TextbookPage';

// ===========================================================
// MissionPage — briefing, objectives, status, reward, notes.
// ===========================================================

export function MissionPage({ slug }: { slug: string }) {
  const { navigate } = useRouter();
  const { setMissionProgress, addXp, state } = useProgress();
  const mission = MISSIONS.find((m) => m.slug === slug);

  if (!mission) {
    return (
      <EmptyState
        icon={<Icon name="Crosshair" size={32} />}
        title="Mission not found"
        action={<NeonButton variant="ghost" onClick={() => navigate('/missions')}>Back to Missions</NeonButton>}
      />
    );
  }

  const locked = mission.status === 'locked';
  const progress = state.missionProgress[mission.id] ?? 0;

  const complete = () => {
    setMissionProgress(mission.id, 100);
    addXp(mission.reward);
  };

  return (
    <div className="space-y-8">
      <button onClick={() => navigate('/missions')} className="qc-focus flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-slate-500 hover:text-neon-300">
        <Icon name="ChevronRight" size={12} className="rotate-180" /> Missions
      </button>

      <GlassPanel variant="cyan" className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-cyan-400">{mission.codename}</div>
            <h1 className="mt-1 font-display text-3xl font-bold text-white text-glow">{mission.title}</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">{mission.briefing}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Chip variant="neon">{mission.difficulty}</Chip>
              <Chip><Icon name="Clock" size={11} /> {mission.estMinutes} min</Chip>
              <Chip variant="cyan"><Icon name="Zap" size={11} /> {mission.reward} XP</Chip>
              {locked && <Chip variant="err"><Icon name="Lock" size={11} /> Locked</Chip>}
            </div>
          </div>
        </div>
      </GlassPanel>

      {/* Objectives */}
      <section>
        <SectionHeader eyebrow="Objectives" title="Mission Objectives" />
        <GlassPanel className="mt-4 p-5">
          <ol className="space-y-3">
            {mission.objectives.map((o, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 font-mono text-[11px] text-cyan-300">
                  {i + 1}
                </span>
                <span className="text-sm text-slate-300">{o}</span>
              </li>
            ))}
          </ol>
          <div className="mt-5">
            <div className="mb-1.5 flex justify-between font-mono text-[11px] text-slate-500">
              <span>Progress</span><span>{progress}%</span>
            </div>
            <ProgressBar value={progress} />
          </div>
          <div className="mt-4">
            <NeonButton disabled={locked || progress >= 100} onClick={complete}>
              <Icon name="CheckCircle2" size={14} /> {progress >= 100 ? 'Completed' : locked ? 'Locked' : 'Submit & Claim XP'}
            </NeonButton>
          </div>
        </GlassPanel>
      </section>

      {/* Briefing terminal */}
      <section>
        <SectionHeader eyebrow="Briefing" title="Operation Brief" />
        <div className="mt-4">
          <Terminal
            title={`${mission.slug}@brief`}
            typed
            lines={[
              { prompt: '$', text: `mission load ${mission.slug}`, kind: 'cmd' },
              { text: `codename: ${mission.codename}`, kind: 'sys' },
              { text: `difficulty: ${mission.difficulty}`, kind: 'out' },
              { text: `reward: ${mission.reward} XP`, kind: 'ok' },
              { text: locked ? 'status: LOCKED — complete prerequisites' : 'status: ready', kind: locked ? 'err' : 'ok' },
              { prompt: '$', text: '_', kind: 'cmd' },
            ]}
          />
        </div>
      </section>

      <NotesBlock storageKey={`notes.mission.${mission.id}`} />
    </div>
  );
}
