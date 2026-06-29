import { useEffect, useRef, useState } from 'react';
import { useRouter } from '../state/router';
import { useProgress } from '../state/progress';
import { NeonButton } from '../components/ui';
import { Icon } from '../components/Icon';
import { cn } from '../lib/cn';

// ===========================================================
// Home — animated boot sequence, logo reveal, terminal startup,
// ENTER SYSTEM button. Then navigates to the dashboard.
// ===========================================================

const BOOT_LINES = [
  { t: 'Initializing Quantum Core...', d: 400 },
  { t: 'Loading kernel modules...', d: 350 },
  { t: 'Mounting /library  ... OK', d: 280 },
  { t: 'Mounting /labs     ... OK', d: 220 },
  { t: 'Mounting /missions ... OK', d: 220 },
  { t: 'Starting system monitor ... OK', d: 300 },
  { t: 'Calibrating neon subsystems ... OK', d: 260 },
  { t: 'Establishing secure channel ... OK', d: 300 },
  { t: 'System online.', d: 200, accent: true },
  { t: 'Ready.', d: 150, accent: true },
];

export function HomePage() {
  const { navigate } = useRouter();
  const { markBooted } = useProgress();
  const [lines, setLines] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [phase, setPhase] = useState<'boot' | 'logo' | 'enter'>('boot');
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let i = 0;
    let timer: number;
    const tick = () => {
      if (i >= BOOT_LINES.length) {
        setDone(true);
        setTimeout(() => setPhase('logo'), 500);
        setTimeout(() => setPhase('enter'), 1500);
        return;
      }
      const line = BOOT_LINES[i];
      setLines((l) => [...l, line.t]);
      i += 1;
      timer = window.setTimeout(tick, line.d);
    };
    timer = window.setTimeout(tick, 500);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [lines]);

  const enter = () => {
    markBooted();
    navigate('/dashboard');
  };

  return (
    <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-10">
      {/* Logo */}
      <div
        className={cn(
          'transition-all duration-700',
          phase === 'boot' ? 'opacity-0 translate-y-2 scale-95' : 'opacity-100 translate-y-0 scale-100',
        )}
      >
        <QuantumLogo />
      </div>

      {/* Boot terminal */}
      <div
        className={cn(
          'mt-10 w-full max-w-xl transition-all duration-500',
          phase === 'enter' ? 'opacity-40' : 'opacity-100',
        )}
      >
        <div className="terminal scanlines overflow-hidden">
          <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-err-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-warn-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-neon-400/70" />
            <span className="ml-2 font-mono text-[11px] text-slate-500">qc://boot</span>
          </div>
          <div ref={logRef} className="h-44 overflow-y-auto p-4 no-scrollbar">
            {lines.map((l, i) => (
              <div key={i} className="term-line animate-fade-in">
                <span className="term-prompt">›</span>
                <span className={cn(l.includes('OK') || l.includes('online') || l.includes('Ready') ? 'text-neon-300' : 'text-slate-400')}>
                  {l}
                </span>
              </div>
            ))}
            {!done && <div className="term-line"><span className="term-prompt">›</span><span className="term-cursor" /></div>}
          </div>
        </div>
      </div>

      {/* ENTER SYSTEM */}
      <div
        className={cn(
          'mt-10 flex flex-col items-center transition-all duration-700',
          phase === 'enter' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none',
        )}
      >
        <NeonButton onClick={enter} className="px-8 py-3.5 text-base animate-pulse-glow">
          <Icon name="Zap" size={18} />
          Enter System
        </NeonButton>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.3em] text-slate-600">
          Press to initialize operator session
        </p>
      </div>
    </div>
  );
}

function QuantumLogo() {
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="120" height="120" viewBox="0 0 120 120" className="drop-shadow-[0_0_25px_rgba(57,255,20,0.35)]">
          <circle cx="60" cy="60" r="40" fill="none" stroke="#39ff14" strokeWidth="2" opacity="0.9" className="animate-spin-slow" style={{ transformOrigin: 'center' }} />
          <circle cx="60" cy="60" r="26" fill="none" stroke="#00f0ff" strokeWidth="1.5" opacity="0.8" />
          <circle cx="60" cy="60" r="5" fill="#39ff14" />
          <path d="M60 8 V34 M60 86 V112 M8 60 H34 M86 60 H112" stroke="#39ff14" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
          <circle cx="60" cy="20" r="2.5" fill="#00f0ff" />
          <circle cx="100" cy="60" r="2.5" fill="#39ff14" />
          <circle cx="60" cy="100" r="2.5" fill="#00f0ff" />
          <circle cx="20" cy="60" r="2.5" fill="#39ff14" />
        </svg>
      </div>
      <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-white text-glow">
        QUANTUM<span className="text-neon-400"> CORE</span>
      </h1>
      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.4em] text-cyan-300/70">
        Cybersecurity Learning OS
      </p>
    </div>
  );
}
