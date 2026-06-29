import { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/cn';

// ===========================================================
// Terminal — reusable typed terminal block.
// Used by textbook examples and the standalone terminal page.
// ===========================================================

export interface TermLine {
  prompt?: string;
  text: string;
  kind?: 'cmd' | 'out' | 'sys' | 'err' | 'ok';
}

export function Terminal({
  lines,
  title = 'qc://terminal',
  typed = false,
  className,
}: {
  lines: TermLine[];
  title?: string;
  typed?: boolean;
  className?: string;
}) {
  const [visible, setVisible] = useState<TermLine[]>(typed ? [] : lines);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!typed) {
      setVisible(lines);
      return;
    }
    setVisible([]);
    let i = 0;
    let timer: number;
    const tick = () => {
      if (i >= lines.length) return;
      setVisible((v) => [...v, lines[i]]);
      i += 1;
      timer = window.setTimeout(tick, 220);
    };
    timer = window.setTimeout(tick, 300);
    return () => window.clearTimeout(timer);
  }, [lines, typed]);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [visible]);

  return (
    <div className={cn('terminal scanlines overflow-hidden', className)}>
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-err-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-warn-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-neon-400/70" />
        <span className="ml-2 font-mono text-[11px] text-slate-500">{title}</span>
      </div>
      <div ref={ref} className="max-h-72 overflow-y-auto p-4 no-scrollbar">
        {visible.map((l, i) => (
          <div key={i} className="term-line animate-fade-in">
            {l.prompt && <span className="term-prompt">{l.prompt}</span>}
            <span
              className={cn(
                l.kind === 'cmd' && 'text-slate-200',
                l.kind === 'out' && 'text-slate-400',
                l.kind === 'sys' && 'text-cyan-400',
                l.kind === 'err' && 'text-err-400',
                l.kind === 'ok' && 'text-neon-300',
                !l.kind && 'text-slate-300',
              )}
            >
              {l.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
