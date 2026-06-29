import { useSettings } from '../state/settings';
import { useProgress } from '../state/progress';
import { GlassPanel, SectionHeader, NeonButton } from '../components/ui';
import { Icon } from '../components/Icon';
import { cn } from '../lib/cn';

// ===========================================================
// Settings — theme, animations, particles, matrix, font size,
// reset progress. All wired to the global settings store.
// ===========================================================

export function SettingsPage() {
  const { settings, update, reset } = useSettings();
  const { state, reset: resetProgress } = useProgress();

  const fontSizes = [
    { label: 'S', value: 0.9 },
    { label: 'M', value: 1 },
    { label: 'L', value: 1.1 },
    { label: 'XL', value: 1.25 },
  ];

  return (
    <div className="space-y-8">
      <SectionHeader eyebrow="Configuration" title="Settings" description="Tune the platform to your environment and preferences." />

      {/* Appearance */}
      <GlassPanel className="p-6">
        <div className="section-eyebrow mb-4">Appearance</div>

        <Row label="Accent Theme" desc="Switch the primary accent flavor.">
          <div className="flex gap-2">
            {(['core', 'cyan'] as const).map((t) => (
              <button
                key={t}
                onClick={() => update({ theme: t })}
                className={cn(
                  'qc-focus flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-xs uppercase tracking-wider transition-all',
                  settings.theme === t ? 'border-neon-400/50 bg-neon-400/10 text-neon-200' : 'border-white/10 text-slate-400 hover:text-white',
                )}
              >
                <span className={cn('h-2.5 w-2.5 rounded-full', t === 'core' ? 'bg-neon-400' : 'bg-cyan-400')} />
                {t === 'core' ? 'Neon' : 'Cyan'}
              </button>
            ))}
          </div>
        </Row>

        <Row label="Font Size" desc="Scale the entire interface.">
          <div className="flex gap-2">
            {fontSizes.map((f) => (
              <button
                key={f.value}
                onClick={() => update({ fontScale: f.value })}
                className={cn(
                  'qc-focus h-9 w-9 rounded-lg border font-mono text-sm transition-all',
                  settings.fontScale === f.value ? 'border-neon-400/50 bg-neon-400/10 text-neon-200' : 'border-white/10 text-slate-400 hover:text-white',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </Row>
      </GlassPanel>

      {/* Effects */}
      <GlassPanel className="p-6">
        <div className="section-eyebrow mb-4">Effects</div>
        <Toggle label="Animations" desc="Transitions, fades, and motion." value={settings.animations} onChange={(v) => update({ animations: v })} />
        <Toggle label="Particles" desc="Ambient particle field in the background." value={settings.particles} onChange={(v) => update({ particles: v })} />
        <Toggle label="Matrix Rain" desc="Subtle falling-glyph overlay." value={settings.matrix} onChange={(v) => update({ matrix: v })} />
      </GlassPanel>

      {/* Data */}
      <GlassPanel className="p-6">
        <div className="section-eyebrow mb-4">Data</div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-medium text-slate-200">Reset Progress</div>
            <p className="mt-0.5 text-sm text-slate-500">Clears XP, completed modules, and mission progress. Notes are kept.</p>
            <div className="mt-2 font-mono text-[11px] text-slate-600">
              Current: {state.xp} XP · {state.completedVolumes.length} volumes · {state.completedLabs.length} labs
            </div>
          </div>
          <NeonButton
            variant="ghost"
            className="border-err-500/30 text-err-400 hover:border-err-500/50 hover:bg-err-500/10"
            onClick={() => {
              if (confirm('Reset all progress? This cannot be undone.')) resetProgress();
            }}
          >
            <Icon name="RotateCcw" size={14} /> Reset Progress
          </NeonButton>
        </div>
      </GlassPanel>

      {/* Reset all settings */}
      <div className="flex justify-end">
        <NeonButton variant="ghost" onClick={reset}>
          <Icon name="RotateCcw" size={14} /> Restore Default Settings
        </NeonButton>
      </div>
    </div>
  );
}

function Row({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 py-4 last:border-0 last:pb-0">
      <div>
        <div className="font-medium text-slate-200">{label}</div>
        <p className="mt-0.5 text-sm text-slate-500">{desc}</p>
      </div>
      {children}
    </div>
  );
}

function Toggle({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 py-4 last:border-0 last:pb-0">
      <div>
        <div className="font-medium text-slate-200">{label}</div>
        <p className="mt-0.5 text-sm text-slate-500">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={cn(
          'qc-focus relative h-7 w-12 shrink-0 rounded-full border transition-colors',
          value ? 'border-neon-400/50 bg-neon-400/20' : 'border-white/10 bg-white/5',
        )}
        role="switch"
        aria-checked={value}
      >
        <span className={cn('absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full transition-all', value ? 'left-6 bg-neon-400 shadow-glow' : 'left-1 bg-slate-500')} />
      </button>
    </div>
  );
}
