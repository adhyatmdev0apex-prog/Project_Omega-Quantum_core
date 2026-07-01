// ===========================================================
// VMLoadingScreen — reusable boot-sequence overlay.
// Matches the Quantum Core aesthetic. Shows a terminal-style
// boot log, progress bar, and animated spinner.
//
// Props:
//   label     — VM label shown in the header (e.g. "Ubuntu 22.04")
//   onCancel  — optional; renders an abort button when provided
//
// The boot steps are fixed and purely cosmetic for now.
// TODO(v86): Drive the steps from real UbuntuVM stateChanged
//            events once the emulator is connected.
// ===========================================================

import { useEffect, useState } from 'react';
import { cn } from '../lib/cn';

interface BootStep {
  label: string;
  durationMs: number;
}

const BOOT_STEPS: BootStep[] = [
  { label: 'Launching Ubuntu VM...', durationMs: 420 },
  { label: 'Loading BIOS...', durationMs: 520 },
  { label: 'Loading Kernel...', durationMs: 680 },
  { label: 'Mounting Filesystem...', durationMs: 580 },
  { label: 'Initializing Devices...', durationMs: 460 },
  { label: 'Starting Bash...', durationMs: 340 },
  { label: 'Ready.', durationMs: 0 },
];

interface VMLoadingScreenProps {
  label?: string;
  onCancel?: () => void;
  className?: string;
}

export function VMLoadingScreen({ label = 'Ubuntu 22.04 LTS', onCancel, className }: VMLoadingScreenProps) {
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function runSequence() {
      for (let i = 0; i < BOOT_STEPS.length; i++) {
        if (cancelled) return;
        setCurrentStep(i);
        await delay(BOOT_STEPS[i].durationMs);
        if (cancelled) return;
        setCompletedSteps((prev) => [...prev, BOOT_STEPS[i].label]);
      }
      setDone(true);
    }

    runSequence();
    return () => { cancelled = true; };
  }, []);

  const progress = done
    ? 100
    : Math.round(((completedSteps.length) / BOOT_STEPS.length) * 100);

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center bg-ink-950',
        className,
      )}
    >
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-neon-400" />
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-neon-400">
            Quantum Core VM
          </span>
        </div>
        <h2 className="font-display text-2xl font-semibold text-white">{label}</h2>
        <p className="mt-1 font-mono text-[12px] text-slate-500">Browser-native Linux environment</p>
      </div>

      {/* Boot log terminal */}
      <div className="w-full max-w-lg rounded-xl border border-white/[0.06] bg-ink-900/80 backdrop-blur-xl">
        {/* Window chrome */}
        <div className="flex items-center gap-1.5 border-b border-white/5 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-err-500/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-warn-500/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-neon-400/60" />
          <span className="ml-3 font-mono text-[10px] text-slate-600">boot — /dev/ttyS0</span>
        </div>

        {/* Log lines */}
        <div className="min-h-[200px] space-y-1 p-4 font-mono text-[12px]">
          {completedSteps.map((step, i) => (
            <div key={i} className="flex items-center gap-3 text-neon-300/80">
              <span className="text-neon-500/60">[ OK ]</span>
              <span>{step}</span>
            </div>
          ))}

          {/* Active / pending step */}
          {!done && currentStep < BOOT_STEPS.length && (
            <div className="flex items-center gap-3 text-cyan-300">
              <Spinner />
              <span className="animate-pulse">{BOOT_STEPS[currentStep].label}</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="border-t border-white/5 px-4 pb-4 pt-3">
          <div className="mb-1.5 flex justify-between font-mono text-[10px] text-slate-500">
            <span>Boot progress</span>
            <span className="text-cyan-300">{progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-neon-400 to-cyan-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Cancel button */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="mt-6 font-mono text-[11px] text-slate-600 underline-offset-2 hover:text-slate-400 hover:underline"
        >
          Cancel and use Virtual Backend
        </button>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      className="h-3 w-3 animate-spin text-cyan-400"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
