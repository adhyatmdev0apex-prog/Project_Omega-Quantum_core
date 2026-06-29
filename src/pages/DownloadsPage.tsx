import { GlassPanel, SectionHeader, NeonButton, Chip } from '../components/ui';
import { Icon } from '../components/Icon';

// ===========================================================
// Downloads — operator toolkit & resources. Future-compatible.
// ===========================================================

const DOWNLOADS = [
  { title: 'Quantum Core Field Guide', desc: 'Offline reference PDF of the core curriculum.', size: '4.2 MB', type: 'PDF', icon: 'FileText' },
  { title: 'Lab VM Image', desc: 'Pre-configured Linux range for local practice.', size: '1.8 GB', type: 'OVA', icon: 'Server' },
  { title: 'Cheat Sheet Pack', desc: 'Command references for every lab tool.', size: '820 KB', type: 'ZIP', icon: 'Archive' },
  { title: 'Wireshark Capture Set', desc: 'Sample pcaps for the analysis labs.', size: '120 MB', type: 'PCAP', icon: 'Waves' },
  { title: 'ESP32 Firmware Samples', desc: 'Flashable firmware for the hardware lab.', size: '6 MB', type: 'BIN', icon: 'Cpu' },
  { title: 'Operator Wallpaper Pack', desc: 'Cyberdeck wallpapers in 4K.', size: '48 MB', type: 'ZIP', icon: 'Image' },
];

export function DownloadsPage() {
  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Resources"
        title="Downloads"
        description="Offline resources, VMs, and reference materials. New resources slot in automatically."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DOWNLOADS.map((d) => (
          <GlassPanel key={d.title} className="p-5" hover>
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-neon-400/30 bg-neon-400/10">
                <Icon name={d.icon} size={20} className="text-neon-400" />
              </div>
              <Chip>{d.type}</Chip>
            </div>
            <h3 className="mt-3 font-display text-base font-semibold text-white">{d.title}</h3>
            <p className="mt-1 text-sm text-slate-400">{d.desc}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="font-mono text-[11px] text-slate-500">{d.size}</span>
              <NeonButton variant="ghost" className="px-3 py-1.5 text-xs">
                <Icon name="Download" size={13} /> Download
              </NeonButton>
            </div>
          </GlassPanel>
        ))}
      </div>
    </div>
  );
}
