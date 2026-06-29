import { useEffect, useRef, useState } from 'react';
import { GlassPanel, SectionHeader, NeonButton } from '../components/ui';
import { Icon } from '../components/Icon';
import { cn } from '../lib/cn';

// ===========================================================
// TerminalPage — interactive fake boot terminal with typing.
// ===========================================================

const SCRIPT: { prompt?: string; text: string; kind?: 'cmd' | 'out' | 'sys' | 'ok' | 'err' }[] = [
  { prompt: '$', text: 'qc boot', kind: 'cmd' },
  { text: 'Initializing Quantum Core...', kind: 'sys' },
  { text: 'Loading modules...', kind: 'sys' },
  { text: '  [ OK ] kernel', kind: 'ok' },
  { text: '  [ OK ] library', kind: 'ok' },
  { text: '  [ OK ] labs', kind: 'ok' },
  { text: '  [ OK ] missions', kind: 'ok' },
  { text: '  [ OK ] system monitor', kind: 'ok' },
  { text: 'Mounting /library  ... OK', kind: 'out' },
  { text: 'Mounting /labs     ... OK', kind: 'out' },
  { text: 'Mounting /missions ... OK', kind: 'out' },
  { text: 'Calibrating neon subsystems ... OK', kind: 'out' },
  { text: 'Establishing secure channel ... OK', kind: 'out' },
  { text: 'System online.', kind: 'ok' },
  { text: 'Ready.', kind: 'ok' },
  { prompt: '$', text: '_', kind: 'cmd' },
];

export function TerminalPage() {
  const [lines, setLines] = useState<typeof SCRIPT>([]);
  const [running, setRunning] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const run = () => {
    setRunning(true);
    setLines([]);
    let i = 0;
    let timer: number;
    const tick = () => {
      if (i >= SCRIPT.length) {
        setRunning(false);
        return;
      }
      setLines((l) => [...l, SCRIPT[i]]);
      i += 1;
      timer = window.setTimeout(tick, 180);
    };
    timer = window.setTimeout(tick, 200);
    (run as unknown as { _t?: number })._t = timer;
  };

  useEffect(() => {
    run();
    return () => window.clearTimeout((run as unknown as { _t?: number })._t);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [lines]);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Diagnostics"
        title="Terminal"
        description="A simulated boot sequence. Aesthetic only — no live system access."
        action={<NeonButton variant="ghost" onClick={run} disabled={running}><Icon name="RotateCcw" size={14} /> Re-run</NeonButton>}
      />

      <GlassPanel className="p-0">
        <div className="terminal scanlines overflow-hidden rounded-none border-0">
          <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-err-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-warn-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-neon-400/70" />
            <span className="ml-2 font-mono text-[11px] text-slate-500">qc://terminal — boot</span>
          </div>
          <div ref={logRef} className="h-[60vh] overflow-y-auto p-5 no-scrollbar">
            {lines.map((l, i) => (
              <div key={i} className="term-line animate-fade-in">
                {l.prompt && <span className="term-prompt">{l.prompt}</span>}
                <span
                  className={cn(
                    l.kind === 'cmd' && 'text-slate-200',
                    l.kind === 'out' && 'text-slate-400',
                    l.kind === 'sys' && 'text-cyan-400',
                    l.kind === 'err' && 'text-err-400',
                    l.kind === 'ok' && 'text-neon-300',
                  )}
                >
                  {l.text}
                </span>
              </div>
            ))}
            {running && <div className="term-line"><span className="term-prompt">›</span><span className="term-cursor" /></div>}
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
