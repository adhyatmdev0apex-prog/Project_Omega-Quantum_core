import { useEffect } from 'react';
import { useRouter } from '../state/router';
import { useProgress } from '../state/progress';
import { VOLUMES, LABS, MISSIONS, ACHIEVEMENTS } from '../data/modules';
import {
  operatorLevel,
  levelProgressPct,
  xpInLevel,
  volumesCompletedCount,
  chaptersCompletedCount,
  labsCompletedCount,
  missionsCompletedCount,
  overallCompletion,
  volumeCompletion,
  currentStreak,
  studyTimeFormatted,
  bookmarksCount,
  notesCount,
  totalAvailableVolumes,
  totalAvailableChapters,
  totalAvailableLabs,
  totalAvailableMissions,
} from '../state/progressEngine';
import { GlassPanel, NeonButton, SectionHeader, Chip, ProgressBar } from '../components/ui';
import { Icon } from '../components/Icon';
import { cn } from '../lib/cn';

// ===========================================================
// Dashboard — the operator's home base. Real stored data drives
// every widget: continue reading, recent activity, latest
// achievement, today's progress, current goal, quick resume.
// ===========================================================

export function DashboardPage() {
  const { navigate } = useRouter();
  const { state, markBooted, startStudySession } = useProgress();

  // Mark boot on first dashboard visit (one-time XP)
  useEffect(() => {
    if (!state.booted) markBooted();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lastVolume = state.lastVolume
    ? VOLUMES.find((v) => v.slug === state.lastVolume)
    : null;
  const nextVolume = VOLUMES.find((v) => !state.completedVolumes.includes(v.id)) ?? VOLUMES[0];
  const nextLab = LABS.find((l) => !state.completedLabs.includes(l.id)) ?? LABS[0];
  const activeMission = MISSIONS.find((m) => m.status !== 'locked') ?? MISSIONS[0];

  const level = operatorLevel(state.xp);
  const xpPct = levelProgressPct(state.xp);
  const overall = overallCompletion(state);

  // Today's progress: activity entries from today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayActivity = state.activity.filter((a) => a.ts >= todayStart.getTime());
  const todayXp = todayActivity.reduce((s, a) => s + a.xp, 0);

  // Latest achievement (first with progress < 100, or most recent activity of type achievement)
  const latestAchievement = ACHIEVEMENTS.find((a) => a.progress < 100) ?? ACHIEVEMENTS[0];

  // Current goal: next incomplete volume
  const currentGoal = nextVolume;

  return (
    <div className="space-y-8">
      <Header level={level} streak={currentStreak(state)} />

      {/* Quick stats — real values */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon="Zap" label="Total XP" value={state.xp.toLocaleString()} sub={`LV ${level} · ${xpInLevel(state.xp)}/500`} accent="neon" />
        <StatCard icon="BookOpen" label="Volumes" value={`${volumesCompletedCount(state)}/${totalAvailableVolumes()}`} sub={`${Math.round(overall)}% overall`} accent="cyan" />
        <StatCard icon="FlaskConical" label="Labs" value={`${labsCompletedCount(state)}/${totalAvailableLabs()}`} accent="neon" />
        <StatCard icon="Crosshair" label="Missions" value={`${missionsCompletedCount(state)}/${totalAvailableMissions()}`} accent="cyan" />
      </div>

      {/* Continue Reading — real last-opened volume */}
      <section>
        <SectionHeader eyebrow="Resume" title="Continue Reading" description="Pick up exactly where you left off." />
        <div className="mt-4">
          {lastVolume ? (
            <ContinueReadingCard
              volume={lastVolume}
              progress={volumeCompletion(state, lastVolume.id)}
              lastScroll={state.lastScroll}
              lastOpenedAt={state.lastOpenedAt}
              onResume={() => {
                startStudySession();
                navigate(`/library/${lastVolume.slug}`);
              }}
            />
          ) : (
            <GlassPanel className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-neon-400/30 bg-neon-400/10">
                  <Icon name="BookOpen" size={22} className="text-neon-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-semibold text-white">Start your first volume</h3>
                  <p className="mt-1 text-sm text-slate-400">Open a volume from the Library to begin tracking your reading progress.</p>
                </div>
                <NeonButton onClick={() => navigate('/library')}>
                  <Icon name="Library" size={14} /> Browse Library
                </NeonButton>
              </div>
            </GlassPanel>
          )}
        </div>
      </section>

      {/* Two-column: Recent Activity + Today's Progress */}
      <section className="grid gap-4 lg:grid-cols-2">
        <RecentActivity activity={state.activity} />
        <TodaysProgress todayXp={todayXp} todayActivity={todayActivity.length} studyTime={studyTimeFormatted(state)} streak={currentStreak(state)} />
      </section>

      {/* Two-column: Latest Achievement + Current Goal */}
      <section className="grid gap-4 lg:grid-cols-2">
        <LatestAchievement achievement={latestAchievement} />
        <CurrentGoal volume={currentGoal} progress={volumeCompletion(state, currentGoal.id)} onGo={() => navigate(`/library/${currentGoal.slug}`)} />
      </section>

      {/* Continue learning — volume + lab */}
      <section>
        <SectionHeader eyebrow="Jump" title="Continue Learning" />
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

function Header({ level, streak }: { level: number; streak: number }) {
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="section-eyebrow mb-1.5">Operator Dashboard</div>
        <h1 className="font-display text-3xl font-bold text-white text-glow">{greeting}, Operator</h1>
        <p className="mt-1.5 text-sm text-slate-400">Level {level} · {streak}-day streak · System nominal.</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-full border border-neon-400/30 bg-neon-400/10 px-3 py-1.5 font-mono text-[11px] text-neon-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon-400" /> SYSTEM ONLINE
        </span>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, accent }: { icon: string; label: string; value: string; sub?: string; accent: 'neon' | 'cyan' }) {
  return (
    <GlassPanel className="p-4" hover>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</span>
        <Icon name={icon} size={16} className={accent === 'neon' ? 'text-neon-400' : 'text-cyan-400'} />
      </div>
      <div className={cn('mt-2 font-display text-2xl font-bold', accent === 'neon' ? 'text-neon-300 text-glow' : 'text-cyan-300 text-glow-cyan')}>
        {value}
      </div>
      {sub && <div className="mt-0.5 font-mono text-[10px] text-slate-500">{sub}</div>}
    </GlassPanel>
  );
}

function ContinueReadingCard({
  volume, progress, lastScroll, lastOpenedAt, onResume,
}: {
  volume: { id: string; slug: string; roman: string; title: string; accent: 'neon' | 'cyan'; chapters: number };
  progress: number;
  lastScroll: number;
  lastOpenedAt: number;
  onResume: () => void;
}) {
  const ago = lastOpenedAt ? timeAgo(lastOpenedAt) : 'never';
  return (
    <GlassPanel variant={volume.accent === 'cyan' ? 'cyan' : 'default'} className="p-5" hover>
      <div className="flex items-start gap-4">
        <div className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border font-display text-2xl font-bold', volume.accent === 'neon' ? 'border-neon-400/30 bg-neon-400/10 text-neon-300' : 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300')}>
          {volume.roman}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Volume {volume.roman} · last read {ago}</div>
          <h3 className="mt-0.5 font-display text-lg font-semibold text-white">{volume.title}</h3>
          <div className="mt-2 flex items-center gap-3">
            <ProgressBar value={progress} className="flex-1" />
            <span className="font-mono text-[11px] text-neon-300">{Math.round(progress)}%</span>
          </div>
          <div className="mt-1 font-mono text-[10px] text-slate-500">scroll: {Math.round(lastScroll)}px</div>
        </div>
        <NeonButton variant={volume.accent === 'cyan' ? 'cyan' : 'neon'} onClick={onResume}>
          <Icon name="Play" size={14} /> Resume
        </NeonButton>
      </div>
    </GlassPanel>
  );
}

function RecentActivity({ activity }: { activity: { id: string; type: string; label: string; xp: number; ts: number }[] }) {
  const iconFor: Record<string, string> = {
    volume: 'BookOpen', chapter: 'FileText', lab: 'FlaskConical', mission: 'Crosshair',
    note: 'StickyNote', bookmark: 'Bookmark', achievement: 'Trophy', boot: 'Power',
  };
  return (
    <GlassPanel className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="section-eyebrow">Recent Activity</div>
        <Icon name="Activity" size={14} className="text-slate-500" />
      </div>
      {activity.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-500">No activity yet. Start reading to build your log.</div>
      ) : (
        <ul className="space-y-2.5">
          {activity.slice(0, 6).map((a) => (
            <li key={a.id} className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                <Icon name={iconFor[a.type] ?? 'Circle'} size={14} className="text-slate-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-slate-200">{a.label}</div>
                <div className="font-mono text-[10px] text-slate-600">{timeAgo(a.ts)}</div>
              </div>
              {a.xp > 0 && <span className="font-mono text-[11px] text-neon-300">+{a.xp} XP</span>}
            </li>
          ))}
        </ul>
      )}
    </GlassPanel>
  );
}

function TodaysProgress({ todayXp, todayActivity, studyTime, streak }: { todayXp: number; todayActivity: number; studyTime: string; streak: number }) {
  return (
    <GlassPanel className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="section-eyebrow">Today's Progress</div>
        <Icon name="Calendar" size={14} className="text-slate-500" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <MiniStat icon="Zap" label="XP today" value={`+${todayXp}`} accent="neon" />
        <MiniStat icon="Activity" label="Events" value={String(todayActivity)} accent="cyan" />
        <MiniStat icon="Clock" label="Study time" value={studyTime} accent="neon" />
        <MiniStat icon="Flame" label="Streak" value={`${streak}d`} accent="cyan" />
      </div>
    </GlassPanel>
  );
}

function MiniStat({ icon, label, value, accent }: { icon: string; label: string; value: string; accent: 'neon' | 'cyan' }) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/20 p-3">
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-500">
        <Icon name={icon} size={11} className={accent === 'neon' ? 'text-neon-400' : 'text-cyan-400'} /> {label}
      </div>
      <div className={cn('mt-1 font-display text-lg font-semibold', accent === 'neon' ? 'text-neon-300' : 'text-cyan-300')}>{value}</div>
    </div>
  );
}

function LatestAchievement({ achievement }: { achievement: { id: string; title: string; desc: string; xp: number; tier: string; progress: number } }) {
  const tierColor: Record<string, string> = {
    bronze: 'text-amber-400', silver: 'text-slate-300', gold: 'text-yellow-300', platinum: 'text-cyan-200',
  };
  return (
    <GlassPanel className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="section-eyebrow">Latest Achievement</div>
        <Icon name="Trophy" size={14} className={tierColor[achievement.tier] ?? 'text-slate-400'} />
      </div>
      <div className="flex items-start gap-3">
        <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border', 'border-white/10 bg-white/5')}>
          <Icon name="Trophy" size={22} className={tierColor[achievement.tier] ?? 'text-slate-400'} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base font-semibold text-white">{achievement.title}</h3>
            <Chip variant="default" className="uppercase">{achievement.tier}</Chip>
          </div>
          <p className="mt-1 text-sm text-slate-400">{achievement.desc}</p>
          <div className="mt-2 flex items-center gap-3">
            <ProgressBar value={achievement.progress} className="flex-1" />
            <span className="font-mono text-[11px] text-slate-400">{achievement.progress}%</span>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}

function CurrentGoal({ volume, progress, onGo }: { volume: { slug: string; roman: string; title: string; accent: 'neon' | 'cyan' }; progress: number; onGo: () => void }) {
  return (
    <GlassPanel className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="section-eyebrow">Current Goal</div>
        <Icon name="Target" size={14} className="text-neon-400" />
      </div>
      <div className="flex items-start gap-3">
        <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border font-display text-xl font-bold', volume.accent === 'neon' ? 'border-neon-400/30 bg-neon-400/10 text-neon-300' : 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300')}>
          {volume.roman}
        </div>
        <div className="flex-1">
          <h3 className="font-display text-base font-semibold text-white">Complete Volume {volume.roman}</h3>
          <p className="mt-1 text-sm text-slate-400">{volume.title}</p>
          <div className="mt-2 flex items-center gap-3">
            <ProgressBar value={progress} className="flex-1" />
            <span className="font-mono text-[11px] text-neon-300">{Math.round(progress)}%</span>
          </div>
        </div>
        <NeonButton variant="ghost" onClick={onGo}>
          <Icon name="ArrowRight" size={14} />
        </NeonButton>
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

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
