import { useEffect, useState } from 'react';
import { useProgress } from '../state/progress';
import { useRouter } from '../state/router';
import { Icon } from './Icon';

// ===========================================================
// StatusBar — bottom region. Clock, session, path, quick stats.
// ===========================================================

export function StatusBar() {
  const { state } = useProgress();
  const { path } = useRouter();
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setTime(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const clock = time.toLocaleTimeString('en-GB', { hour12: false });

  return (
    <footer className="relative z-10 flex items-center justify-between gap-3 border-t border-white/5 bg-ink-950/80 px-4 py-1.5 font-mono text-[11px] text-slate-500 backdrop-blur-xl md:px-6">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-neon-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon-400" />
          ONLINE
        </span>
        <span className="hidden text-slate-600 sm:inline">|</span>
        <span className="hidden items-center gap-1.5 sm:flex">
          <Icon name="Shield" size={11} /> SECURE
        </span>
        <span className="hidden text-slate-600 md:inline">|</span>
        <span className="hidden truncate text-cyan-400/70 md:inline">qc://{path || '/'}</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden items-center gap-1.5 sm:flex">
          <Icon name="Zap" size={11} className="text-neon-400" /> {state.xp} XP
        </span>
        <span className="hidden text-slate-600 sm:inline">|</span>
        <span className="flex items-center gap-1.5">
          <Icon name="Clock" size={11} /> {clock}
        </span>
      </div>
    </footer>
  );
}
