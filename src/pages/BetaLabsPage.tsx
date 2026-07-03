// ===========================================================
// BetaLabsPage — listing of all experimental learning environments.
// Research department feel with warning badge and card grid.
// ===========================================================

import { useRouter } from '../state/router';
import { GlassPanel, SectionHeader, Chip } from '../components/ui';
import { BetaCard } from '../components/BetaCard';
import { Icon } from '../components/Icon';
import { BETA_LABS } from '../data/betaLabs';

export function BetaLabsPage() {
  const { navigate } = useRouter();

  return (
    <div className="space-y-8">
      {/* Header */}
      <SectionHeader
        eyebrow="Experimental"
        title="Beta Labs"
        description="Test bleeding-edge learning environments before they become official. Your feedback directly shapes Quantum Core."
      />

      {/* Warning panel */}
      <GlassPanel className="border-warn-400/30 bg-warn-400/5 p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-warn-400/30 bg-warn-400/10">
            <Icon name="AlertTriangle" size={18} className="text-warn-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg font-semibold text-white">Experimental Environments</h3>
              <Chip variant="warn">Experimental</Chip>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">
              These labs are under active development. Features may be incomplete or change without notice.
              Your feedback helps identify bugs, improve usability, and prioritize new features.
            </p>
          </div>
        </div>
      </GlassPanel>

      {/* Beta lab cards */}
      {BETA_LABS.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BETA_LABS.map((lab) => (
            <BetaCard
              key={lab.id}
              lab={lab}
              onClick={() => navigate(`/beta/${lab.slug}`)}
            />
          ))}
        </div>
      ) : (
        <GlassPanel className="flex flex-col items-center justify-center py-16 text-center">
          <Icon name="FlaskConical" size={40} className="text-slate-600" />
          <h3 className="mt-4 font-display text-lg text-slate-300">No Beta Labs Available</h3>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            Experimental labs are being prepared. Check back soon for early access to new learning environments.
          </p>
        </GlassPanel>
      )}

      {/* Future labs hint */}
      <GlassPanel className="border-dashed border-white/10 p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.02]">
            <Icon name="Plus" size={18} className="text-slate-500" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-slate-300">More Coming Soon</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              Planned labs include: Linux VM, Kali VM, Wireshark Lab, Cloud Simulator,
              Docker Lab, ESP32 Lab, and more. Want to see something specific? Use the
              feedback form in any beta lab to request new environments.
            </p>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
