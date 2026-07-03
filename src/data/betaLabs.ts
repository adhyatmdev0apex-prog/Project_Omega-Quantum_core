// ===========================================================
// Beta Labs — experimental learning environments.
// Add new labs by extending this array. Drop the HTML simulator
// into /public/beta/<slug>/index.html and add a matching entry here.
// ===========================================================

export type BetaLabStatus = 'experimental' | 'alpha' | 'beta' | 'preview';

export interface BetaLab {
  id: string;
  slug: string;
  title: string;
  description: string;
  version: string;
  status: BetaLabStatus;
  progress: number; // 0-100 estimated completion
  lastUpdated: string; // ISO date
  icon: string;
  tags: string[];
  /** Thumbnail image path (optional). */
  thumbnail?: string;
}

export const BETA_LABS: BetaLab[] = [
  {
    id: 'beta-networking',
    slug: 'networking',
    title: 'Networking Simulator',
    description: 'Interactive packet visualization and networking missions. Build, configure, and troubleshoot virtual networks.',
    version: 'v0.1 Alpha',
    status: 'experimental',
    progress: 40,
    lastUpdated: '2026-07-01',
    icon: 'Network',
    tags: ['networking', 'packets', 'routing'],
  },
  // Future labs — uncomment and add HTML to /public/beta/<slug>/index.html
  // {
  //   id: 'beta-linux-vm',
  //   slug: 'linux-vm',
  //   title: 'Linux VM',
  //   description: 'Full browser-based Ubuntu VM powered by v86.',
  //   version: 'v0.0 Pre-Alpha',
  //   status: 'experimental',
  //   progress: 15,
  //   lastUpdated: '2026-06-15',
  //   icon: 'Monitor',
  //   tags: ['linux', 'vm', 'terminal'],
  // },
  // {
  //   id: 'beta-kali',
  //   slug: 'kali',
  //   title: 'Kali VM',
  //   description: 'Browser-based Kali Linux for penetration testing exercises.',
  //   version: 'v0.0 Pre-Alpha',
  //   status: 'experimental',
  //   progress: 10,
  //   lastUpdated: '2026-06-10',
  //   icon: 'Shield',
  //   tags: ['kali', 'pentest', 'security'],
  // },
  // {
  //   id: 'beta-wireshark',
  //   slug: 'wireshark',
  //   title: 'Wireshark Lab',
  //   description: 'Packet analysis and protocol inspection in your browser.',
  //   version: 'v0.0 Planned',
  //   status: 'experimental',
  //   progress: 5,
  //   lastUpdated: '2026-06-01',
  //   icon: 'Activity',
  //   tags: ['wireshark', 'packets', 'analysis'],
  // },
  // {
  //   id: 'beta-cloud',
  //   slug: 'cloud',
  //   title: 'Cloud Simulator',
  //   description: 'Deploy and manage virtual cloud infrastructure.',
  //   version: 'v0.0 Planned',
  //   status: 'experimental',
  //   progress: 5,
  //   lastUpdated: '2026-06-01',
  //   icon: 'Cloud',
  //   tags: ['cloud', 'aws', 'infrastructure'],
  // },
  // {
  //   id: 'beta-docker',
  //   slug: 'docker',
  //   title: 'Docker Lab',
  //   description: 'Container orchestration and Docker fundamentals.',
  //   version: 'v0.0 Planned',
  //   status: 'experimental',
  //   progress: 5,
  //   lastUpdated: '2026-06-01',
  //   icon: 'Box',
  //   tags: ['docker', 'containers', 'devops'],
  // },
  // {
  //   id: 'beta-esp32',
  //   slug: 'esp32',
  //   title: 'ESP32 Lab',
  //   description: 'IoT and embedded systems programming simulator.',
  //   version: 'v0.0 Planned',
  //   status: 'experimental',
  //   progress: 5,
  //   lastUpdated: '2026-06-01',
  //   icon: 'Cpu',
  //   tags: ['esp32', 'iot', 'embedded'],
  // },
];

export function getBetaLab(slug: string): BetaLab | undefined {
  return BETA_LABS.find((lab) => lab.slug === slug);
}
