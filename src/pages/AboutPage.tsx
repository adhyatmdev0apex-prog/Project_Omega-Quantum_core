import { GlassPanel, SectionHeader, Chip, NeonButton } from '../components/ui';
import { Icon } from '../components/Icon';
import { useRouter } from '../state/router';

// ===========================================================
// About — platform overview, architecture, future modules.
// ===========================================================

export function AboutPage() {
  const { navigate } = useRouter();

  const stack = [
    { label: 'Frontend', value: 'React + TypeScript + Vite' },
    { label: 'Styling', value: 'Tailwind CSS + custom design system' },
    { label: 'Icons', value: 'Lucide React' },
    { label: 'Persistence', value: 'Supabase + localStorage' },
    { label: 'Routing', value: 'Hash router (zero deps)' },
  ];

  const future = [
    'Cloud attack-chain simulator',
    'Live cyber range with scoring',
    'Team / cohort collaboration',
    'Certification tracks',
    'AI operator assistant',
    'CTF event hosting',
    'Custom lab authoring',
    'Threat-intel feed integration',
  ];

  return (
    <div className="space-y-8">
      <SectionHeader eyebrow="System" title="About Quantum Core" description="An operating system for learning cybersecurity — built to grow for years." />

      <GlassPanel className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-neon-400/30 bg-neon-400/10">
            <Icon name="Shield" size={26} className="text-neon-400" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-white">The Mission</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
              Quantum Core combines the depth of a published technical book series, the hands-on practice of a lab
              platform, and the operational feel of a cyberdeck — into one expandable learning OS. The architecture is
              modular: every volume, lab, and mission is a registry entry, so the platform scales to hundreds of modules
              and thousands of pages without restructuring.
            </p>
          </div>
        </div>
      </GlassPanel>

      <section>
        <SectionHeader eyebrow="Under the hood" title="Architecture" />
        <GlassPanel className="mt-4 divide-y divide-white/5 p-0">
          {stack.map((s) => (
            <div key={s.label} className="flex items-center justify-between px-5 py-3.5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500">{s.label}</span>
              <span className="text-sm text-slate-200">{s.value}</span>
            </div>
          ))}
        </GlassPanel>
      </section>

      <section>
        <SectionHeader eyebrow="Roadmap" title="Future Modules" description="The platform is designed to absorb these without rearchitecting." />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {future.map((f) => (
            <GlassPanel key={f} className="flex items-center gap-3 p-4" hover>
              <Icon name="Sparkles" size={16} className="text-cyan-400" />
              <span className="text-sm text-slate-300">{f}</span>
              <Chip className="ml-auto">planned</Chip>
            </GlassPanel>
          ))}
        </div>
      </section>

      <div className="flex justify-center">
        <NeonButton onClick={() => navigate('/dashboard')}>
          <Icon name="LayoutDashboard" size={14} /> Return to Dashboard
        </NeonButton>
      </div>
    </div>
  );
}
