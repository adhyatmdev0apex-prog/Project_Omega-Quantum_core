import { useRouter } from '../state/router';
import { useProgress } from '../state/progress';
import { VOLUMES, LABS, MISSIONS } from '../data/modules';
import { GlassPanel, NeonButton, SectionHeader, Chip } from '../components/ui';
import { Icon } from '../components/Icon';
import { cn } from '../lib/cn';

// ===========================================================
// Dashboard — the operator’s home base. Quick stats, jump-back
// in, continue learning, missions overview.
// ===========================================================

export function DashboardPage() {
  const { navigate } = useRouter();
  const { state } = useProgress();

  const nextVolume = VOLUMES.find((v) => !state.completedVolumes.includes(v.id)) ?? VOLUMES[0];
  const nextLab = LABS.find((l) => !state.completedLabs.includes(l.id)) ?? LABS[0];
  const activeMission = MISSIONS.find((m) => m.status !== 'locked') ?? MISSIONS[0];

  return (
    <div className="space-y-8">
      <Header />

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon="Trophy" label="Total XP" value={state.xp.toLocaleString()} accent="neon" />
        <StatCard icon="BookOpen" label="Volumes" value={`${state.completedVolumes.length}/5`} accent="cyan" />
        <StatCard icon="FlaskConical" label="Labs" value={`${state.completedLabs.length}/10`} accent="neon" />
        <StatCard icon="Crosshair" label="Missions" value={`${Object.values(state.missionProgress).filter((v) => v >= 100).length}/3`} accent="cyan" />
      </div>

      {/* Continue learning */}
      <section>
        <SectionHeader eyebrow="Resume" title="Continue Learning" description="Pick up exactly where you left off." />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <ContinueCard
            eyebrow={`Volume ${nextVolume.roman}`}
            title={nextVolume.title}
            desc={nextVolume.blurb}
            meta={`${nextVolume.chapters} chapters · ${nextVolume.estHours}h`}
            icon="BookOpen"
            accent={nextVolume.accent}
            onClick={() => navigate(`/library/${nextVolume.slug}`)}
          />
          <ContinueCard
            eyebrow="Lab"
            title={nextLab.title}
            desc={nextLab.blurb}
            meta={`${nextLab.estMinutes} min · ${nextLab.difficulty}`}
            icon={nextLab.icon}
            accent="cyan"
            onClick={() => navigate(`/labs/${nextLab.slug}`)}
          />
        </div>
      </section>

      {/* Active mission */}
      <section>
        <SectionHeader
          eyebrow="Active Operation"
          title="Current Mission"
          action={<NeonButton variant="ghost" onClick={() => navigate('/missions')}>All missions <Icon name="ArrowRight" size={14} /></NeonButton>}
        />
        <GlassPanel className="mt-4 p-5" hover>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-400">{activeMission.codename}</div>
              <h3 className="mt-1 font-display text-xl font-semibold text-white">{activeMission.title}</h3>
              <p className="mt-2 max-w-xl text-sm text-slate-400">{activeMission.briefing}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Chip variant="cyan">{activeMission.difficulty}</Chip>
                <Chip><Icon name="Clock" size={11} /> {activeMission.estMinutes} min</Chip>
                <Chip variant="neon"><Icon name="Zap" size={11} /> {activeMission.reward} XP</Chip>
              </div>
            </div>
            <NeonButton onClick={() => navigate(`/missions/${activeMission.slug}`)}>
              <Icon name="Play" size={14} /> Brief
            </NeonButton>
          </div>
        </GlassPanel>
      </section>

      {/* Quick links */}
      <section>
        <SectionHeader eyebrow="Jump" title="Quick Access" />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <QuickLink icon="Library" label="Library" onClick={() => navigate('/library')} />
          <QuickLink icon="FlaskConical" label="Labs" onClick={() => navigate('/labs')} />
          <QuickLink icon="Crosshair" label="Missions" onClick={() => navigate('/missions')} />
          <QuickLink icon="StickyNote" label="Notes" onClick={() => navigate('/notes')} />
          <QuickLink icon="Trophy" label="Achievements" onClick={() => navigate('/achievements')} />
          <QuickLink icon="Search" label="Search" onClick={() => navigate('/search')} />
          <QuickLink icon="Download" label="Downloads" onClick={() => navigate('/downloads')} />
          <QuickLink icon="Settings" label="Settings" onClick={() => navigate('/settings')} />
        </div>
      </section>
    </div>
  );
}

function Header() {
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="section-eyebrow mb-1.5">Operator Dashboard</div>
        <h1 className="font-display text-3xl font-bold text-white text-glow">{greeting}, Operator</h1>
        <p className="mt-1.5 text-sm text-slate-400">System nominal. All subsystems online.</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-full border border-neon-400/30 bg-neon-400/10 px-3 py-1.5 font-mono text-[11px] text-neon-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon-400" /> SYSTEM ONLINE
        </span>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, accent }: { icon: string; label: string; value: string; accent: 'neon' | 'cyan' }) {
  return (
    <GlassPanel className="p-4" hover>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</span>
        <Icon name={icon} size={16} className={accent === 'neon' ? 'text-neon-400' : 'text-cyan-400'} />
      </div>
      <div className={cn('mt-2 font-display text-2xl font-bold', accent === 'neon' ? 'text-neon-300 text-glow' : 'text-cyan-300 text-glow-cyan')}>
        {value}
      </div>
    </GlassPanel>
  );
}

function ContinueCard({
  eyebrow, title, desc, meta, icon, accent, onClick,
}: { eyebrow: string; title: string; desc: string; meta: string; icon: string; accent: 'neon' | 'cyan'; onClick: () => void }) {
  return (
    <GlassPanel className="group cursor-pointer p-5" hover onClick={onClick}>
      <div className="flex items-start gap-4">
        <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border', accent === 'neon' ? 'border-neon-400/30 bg-neon-400/10' : 'border-cyan-400/30 bg-cyan-400/10')}>
          <Icon name={icon} size={22} className={accent === 'neon' ? 'text-neon-400' : 'text-cyan-400'} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">{eyebrow}</div>
          <h3 className="mt-0.5 font-display text-lg font-semibold text-white">{title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-slate-400">{desc}</p>
          <div className="mt-2.5 flex items-center justify-between">
            <span className="font-mono text-[11px] text-slate-500">{meta}</span>
            <span className="flex items-center gap-1 font-mono text-[11px] text-neon-300 opacity-0 transition-opacity group-hover:opacity-100">
              Open <Icon name="ArrowRight" size={12} />
            </span>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}

function QuickLink({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="qc-focus group">
      <GlassPanel className="flex flex-col items-center gap-2 p-4" hover>
        <Icon name={icon} size={22} className="text-slate-500 transition-colors group-hover:text-neon-400" />
        <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400 group-hover:text-white">{label}</span>
      </GlassPanel>
    </button>
  );
}
