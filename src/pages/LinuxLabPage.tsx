import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { useRouter } from '../state/router';
import { useProgress } from '../state/progress';
import { LinuxEngine, StubBackend, type SessionState } from '../lib/linuxEngine';
import { GlassPanel, NeonButton, Chip, ProgressBar } from '../components/ui';
import { Icon } from '../components/Icon';
import { NotesBlock } from './TextbookPage';
import { cn } from '../lib/cn';
import '@xterm/xterm/css/xterm.css';

// ===========================================================
// LinuxLabPage — a professional Linux workstation inside Quantum Core.
// Full-screen responsive terminal (xterm.js), status bar, session
// info, current directory, collapsible instructions + progress panels,
// mission objectives, reset/save/return buttons.
//
// The terminal engine (linuxEngine.ts) is modular and independent.
// A future browser-based Linux engine can be attached via
// engine.attach(realBackend) without touching this UI.
// ===========================================================

const LAB_META = {
  id: 'l1',
  slug: 'linux',
  title: 'Linux Lab',
  codename: 'OP. SHELL',
  difficulty: 'Initiate' as const,
  estMinutes: 45,
  objectives: [
    { id: 'o1', label: 'Navigate the filesystem with cd, pwd, and ls', hint: 'Try: ls, cd /, pwd' },
    { id: 'o2', label: 'Inspect file contents with cat and less', hint: 'Try: cat /etc/os-release' },
    { id: 'o3', label: 'Use grep to search inside files', hint: 'Try: grep root /etc/passwd' },
    { id: 'o4', label: 'Chain commands with pipes', hint: 'Try: cat /etc/passwd | grep root | wc -l' },
    { id: 'o5', label: 'Document your findings in the notebook', hint: 'Use the notes panel below' },
  ],
  instructions: [
    'This is a live terminal. A full browser-based Linux engine will be connected here in a future update — the interface is already wired for it.',
    'For now, session-control commands work: clear, pwd, whoami, hostname, history, echo, help.',
    'Use the terminal as you would a real shell. Your session (history + working directory) can be saved and restored across visits.',
    'Complete the objectives in the progress panel, then mark the lab complete to earn XP.',
  ],
};

export function LinuxLabPage() {
  const { navigate } = useRouter();
  const { state: profile, completeLab, setStatus, startStudySession, endStudySession } = useProgress();

  const [session, setSession] = useState<SessionState | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showProgress, setShowProgress] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [objectives, setObjectives] = useState<Record<string, boolean>>({});

  const termRef = useRef<HTMLDivElement>(null);
  const termInstance = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const engine = useRef<LinuxEngine | null>(null);
  const inputBuffer = useRef('');

  // Init engine + terminal once
  useEffect(() => {
    if (!termRef.current) return;

    const term = new Terminal({
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: 14,
      theme: {
        background: '#04060a',
        foreground: '#c8ffd4',
        cursor: '#39ff14',
        cursorAccent: '#04060a',
        selectionBackground: 'rgba(57, 255, 20, 0.25)',
        black: '#04060a',
        green: '#39ff14',
        cyan: '#00f0ff',
        red: '#ff4d4d',
        yellow: '#ffd24d',
        blue: '#4d9fff',
        magenta: '#ff4df0',
        white: '#e8ffe2',
        brightBlack: '#3a4a3a',
        brightGreen: '#5fff5f',
        brightCyan: '#5ff0ff',
        brightRed: '#ff7d7d',
        brightYellow: '#ffe24d',
        brightBlue: '#7dbfff',
        brightMagenta: '#ff7df0',
        brightWhite: '#ffffff',
      },
      cursorBlink: true,
      allowProposedApi: true,
      scrollback: 5000,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.loadAddon(new WebLinksAddon());
    term.open(termRef.current);
    termInstance.current = term;
    fitAddon.current = fit;

    // Defer fit so the container has concrete dimensions after layout
    requestAnimationFrame(() => {
      try { fit.fit(); } catch { /* ignore */ }
    });

    const eng = new LinuxEngine();
    eng.attach(StubBackend);
    engine.current = eng;

    const unsub = eng.subscribe((s) => setSession(s));

    // Restore saved session if present
    if (eng.hasSavedSession()) {
      eng.restore();
    }

    writeBanner(term, eng.getState());
    writePrompt(term, eng.getState());

    // Command input loop
    const onData = (data: string) => {
      const engState = eng.getState();
      if (!engState) return;
      // Enter
      if (data === '\r') {
        term.write('\r\n');
        const cmd = inputBuffer.current;
        inputBuffer.current = '';
        if (cmd.trim()) {
          eng.run(cmd).then((result) => {
            if (result.clear) {
              term.clear();
            } else if (result.output) {
              term.write(result.output + '\r\n');
            }
            writePrompt(term, eng.getState());
          });
        } else {
          writePrompt(term, eng.getState());
        }
      }
      // Backspace
      else if (data === '\u007f') {
        if (inputBuffer.current.length > 0) {
          inputBuffer.current = inputBuffer.current.slice(0, -1);
          term.write('\b \b');
        }
      }
      // Ctrl+C
      else if (data === '\u0003') {
        inputBuffer.current = '';
        term.write('^C\r\n');
        writePrompt(term, eng.getState());
      }
      // Ctrl+L (clear)
      else if (data === '\u000c') {
        term.clear();
        writePrompt(term, eng.getState());
      }
      // Printable chars
      else if (data >= ' ' && data !== '\u001b') {
        inputBuffer.current += data;
        term.write(data);
      }
    };
    term.onData(onData);

    // Resize observer
    const ro = new ResizeObserver(() => {
      try { fit.fit(); } catch { /* ignore */ }
    });
    ro.observe(termRef.current);

    // Status + study session
    setStatus('lab');
    startStudySession();

    return () => {
      unsub();
      ro.disconnect();
      term.dispose();
      eng.dispose();
      endStudySession();
      setStatus('idle');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refit on fullscreen toggle
  useEffect(() => {
    const id = window.setTimeout(() => {
      try { fitAddon.current?.fit(); } catch { /* ignore */ }
    }, 50);
    return () => window.clearTimeout(id);
  }, [fullscreen, showInstructions, showProgress]);

  const handleReset = useCallback(() => {
    const eng = engine.current;
    const term = termInstance.current;
    if (!eng || !term) return;
    eng.reset();
    eng.clearSaved();
    setSaved(false);
    setObjectives({});
    term.clear();
    writeBanner(term, eng.getState());
    writePrompt(term, eng.getState());
  }, []);

  const handleSave = useCallback(() => {
    engine.current?.save();
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }, []);

  const handleComplete = useCallback(() => {
    completeLab(LAB_META.id);
  }, [completeLab]);

  const done = profile.completedLabs.includes(LAB_META.id);
  const completedObjectives = Object.values(objectives).filter(Boolean).length;
  const progress = (completedObjectives / LAB_META.objectives.length) * 100;

  return (
    <div className={cn('flex flex-col gap-4', fullscreen && 'fixed inset-0 z-50 bg-ink-950 p-4')}>
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="qc-focus flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-slate-500 hover:text-neon-300"
          >
            <Icon name="ChevronRight" size={12} className="rotate-180" /> Dashboard
          </button>
          <span className="hidden text-slate-700 sm:inline">/</span>
          <span className="hidden font-mono text-[11px] uppercase tracking-wider text-cyan-400 sm:inline">{LAB_META.codename}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInstructions((s) => !s)}
            className={cn('qc-focus flex items-center gap-1 rounded-lg border px-2.5 py-1.5 font-mono text-[11px] transition-colors', showInstructions ? 'border-neon-400/40 bg-neon-400/10 text-neon-300' : 'border-white/10 text-slate-400 hover:text-neon-300')}
            title="Toggle instructions"
          >
            <Icon name="PanelLeft" size={13} /> <span className="hidden sm:inline">Instructions</span>
          </button>
          <button
            onClick={() => setShowProgress((s) => !s)}
            className={cn('qc-focus flex items-center gap-1 rounded-lg border px-2.5 py-1.5 font-mono text-[11px] transition-colors', showProgress ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300' : 'border-white/10 text-slate-400 hover:text-cyan-300')}
            title="Toggle progress"
          >
            <Icon name="PanelRight" size={13} /> <span className="hidden sm:inline">Progress</span>
          </button>
          <button
            onClick={() => setFullscreen((f) => !f)}
            className="qc-focus flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 font-mono text-[11px] text-slate-400 hover:text-neon-300"
            title="Fullscreen terminal"
          >
            <Icon name={fullscreen ? 'Minimize2' : 'Maximize2'} size={13} /> <span className="hidden sm:inline">{fullscreen ? 'Exit' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>

      {/* Main grid: instructions | terminal | progress */}
      <div className={cn('grid gap-4', fullscreen ? 'flex-1 grid-rows-1' : 'lg:grid-cols-[260px_1fr_280px]')}>
        {/* Instructions panel */}
        {showInstructions && (
          <GlassPanel className={cn('flex flex-col p-0', fullscreen ? 'hidden' : 'max-h-[70vh] overflow-y-auto no-scrollbar')}>
            <div className="border-b border-white/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <Icon name="BookOpen" size={14} className="text-neon-400" />
                <span className="font-mono text-[11px] uppercase tracking-wider text-slate-300">Lab Instructions</span>
              </div>
            </div>
            <div className="space-y-3 p-4">
              <div>
                <div className="font-display text-lg font-semibold text-white">{LAB_META.title}</div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Chip variant="neon">{LAB_META.difficulty}</Chip>
                  <Chip><Icon name="Clock" size={11} /> {LAB_META.estMinutes}m</Chip>
                </div>
              </div>
              {LAB_META.instructions.map((inst, i) => (
                <p key={i} className="text-sm leading-relaxed text-slate-400">{inst}</p>
              ))}
            </div>
          </GlassPanel>
        )}

        {/* Terminal area */}
        <div className={cn('relative flex flex-col', fullscreen ? 'flex-1' : '')}>
          {/* Terminal toolbar */}
          <div className="flex items-center justify-between border-b border-white/5 bg-ink-900/60 px-4 py-2.5 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-err-500/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-warn-500/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-neon-400/70" />
              <span className="ml-2 font-mono text-[11px] text-slate-500">
                {session ? `${session.user}@${session.host}` : 'operator@quantum-core'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full border border-neon-400/30 bg-neon-400/10 px-2.5 py-0.5 font-mono text-[10px] text-neon-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon-400" /> ACTIVE
              </span>
            </div>
          </div>

          {/* xterm container */}
          <div
            ref={termRef}
            className={cn(
              'relative w-full overflow-hidden bg-ink-950',
              fullscreen ? 'h-full' : 'h-[60vh] md:h-[65vh]',
            )}
            style={{ minHeight: fullscreen ? '100%' : '400px' }}
          />
          {/* Scanline overlay — sibling, not on the xterm container */}
          <div className="scanlines pointer-events-none absolute inset-0 z-10" />

          {/* Status bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/5 bg-ink-900/60 px-4 py-2 font-mono text-[11px] text-slate-500 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Icon name="FolderTree" size={11} /> {session?.cwd ?? '/home/operator'}
              </span>
              <span className="hidden text-slate-700 sm:inline">|</span>
              <span className="hidden items-center gap-1.5 sm:flex">
                <Icon name="Clock" size={11} /> {session ? uptime(session.startedAt) : '0m'}
              </span>
              <span className="hidden text-slate-700 md:inline">|</span>
              <span className="hidden items-center gap-1.5 md:flex">
                <Icon name="ListChecks" size={11} /> {session?.history.length ?? 0} cmds
              </span>
            </div>
            <div className="flex items-center gap-3">
              {session?.exitCode !== null && session?.exitCode !== 0 && (
                <span className="flex items-center gap-1 text-err-400">
                  <Icon name="X" size={11} /> exit {session.exitCode}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-neon-400">
                <Icon name="Cpu" size={11} /> {engine.current ? 'stub' : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Progress sidebar */}
        {showProgress && (
          <GlassPanel className={cn('flex flex-col p-0', fullscreen ? 'hidden' : 'max-h-[70vh] overflow-y-auto no-scrollbar')}>
            <div className="border-b border-white/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <Icon name="Target" size={14} className="text-cyan-400" />
                <span className="font-mono text-[11px] uppercase tracking-wider text-slate-300">Mission Objectives</span>
              </div>
            </div>
            <div className="flex-1 space-y-3 p-4">
              <div>
                <div className="mb-1.5 flex justify-between font-mono text-[10px] text-slate-500">
                  <span>Progress</span>
                  <span className="text-cyan-300">{Math.round(progress)}%</span>
                </div>
                <ProgressBar value={progress} />
              </div>
              <ol className="space-y-2.5">
                {LAB_META.objectives.map((o, i) => {
                  const checked = objectives[o.id];
                  return (
                    <li key={o.id}>
                      <button
                        onClick={() => setObjectives((s) => ({ ...s, [o.id]: !s[o.id] }))}
                        className="qc-focus w-full text-left"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border', checked ? 'border-neon-400/40 bg-neon-400/10 text-neon-300' : 'border-white/10 text-slate-600')}>
                            {checked ? <Icon name="CheckCircle2" size={12} /> : i + 1}
                          </span>
                          <div>
                            <div className={cn('text-sm', checked ? 'text-slate-400 line-through' : 'text-slate-200')}>{o.label}</div>
                            <div className="mt-0.5 font-mono text-[10px] text-slate-600">{o.hint}</div>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
            <div className="border-t border-white/5 p-4">
              <NeonButton
                variant={done ? 'ghost' : 'neon'}
                disabled={done}
                onClick={handleComplete}
                className="w-full justify-center"
              >
                <Icon name="CheckCircle2" size={14} /> {done ? 'Lab Complete' : 'Mark Complete'}
              </NeonButton>
            </div>
          </GlassPanel>
        )}
      </div>

      {/* Action bar — hidden in fullscreen */}
      {!fullscreen && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <NeonButton variant="ghost" onClick={handleReset}>
              <Icon name="RotateCcw" size={14} /> Reset Lab
            </NeonButton>
            <NeonButton variant="ghost" onClick={handleSave}>
              <Icon name="Save" size={14} /> {saved ? 'Saved!' : 'Save Session'}
            </NeonButton>
          </div>
          <NeonButton variant="ghost" onClick={() => navigate('/dashboard')}>
            <Icon name="LayoutDashboard" size={14} /> Return to Dashboard
          </NeonButton>
        </div>
      )}

      {/* Notes — hidden in fullscreen */}
      {!fullscreen && <NotesBlock storageKey={`notes.lab.${LAB_META.id}`} />}
    </div>
  );
}

// ---- Terminal helpers ----

function writeBanner(term: Terminal, s: SessionState) {
  term.writeln('\x1b[32m  ╔══════════════════════════════════════════╗\x1b[0m');
  term.writeln('\x1b[32m  ║   QUANTUM CORE — LINUX LAB SHELL         ║\x1b[0m');
  term.writeln('\x1b[32m  ╚══════════════════════════════════════════╝\x1b[0m');
  term.writeln(`\x1b[90m  user:\x1b[0m ${s.user}@${s.host}   \x1b[90mshell:\x1b[0m /bin/bash`);
  term.writeln('\x1b[90m  Type "help" for available commands.\x1b[0m');
  term.writeln('');
}

function writePrompt(term: Terminal, s: SessionState) {
  term.write(`\x1b[32m${s.user}@${s.host}\x1b[0m:\x1b[34m${s.cwd}\x1b[0m$ `);
}

function uptime(startedAt: number): string {
  const mins = Math.floor((Date.now() - startedAt) / 60000);
  if (mins < 1) return '<1m';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  return `${h}h ${mins % 60}m`;
}
