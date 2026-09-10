import { useRouter } from '../state/router';
import { SectionHeader, EmptyState, NeonButton } from '../components/ui';
import { Icon } from '../components/Icon';

// ===========================================================
// ESP-32 category content. Separate from the Cyber Security
// curriculum entirely — no shared data. Currently a placeholder;
// future ESP-32 guides render here once written, following the
// same volume/chapter pattern as Cyber Security if desired.
// ===========================================================

export function Esp32LibraryPage() {
  const { navigate } = useRouter();

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Knowledge Base / ESP-32"
        title="ESP-32"
        description="Embedded systems curriculum — microcontroller fundamentals, firmware, and hands-on builds."
      />

      <EmptyState
        icon={<Icon name="Cpu" size={40} />}
        title="ESP-32 material is on the way"
        description="Beginner guides and embedded learning content will appear here as they're written. This domain is kept separate from the Cyber Security curriculum."
        action={
          <NeonButton variant="cyan" onClick={() => navigate('/library')}>
            <Icon name="ArrowLeft" size={14} /> Back to Library
          </NeonButton>
        }
      />
    </div>
  );
}
