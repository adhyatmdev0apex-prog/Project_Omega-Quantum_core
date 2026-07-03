// ===========================================================
// QUANTUM CORE — Central module registry
// Single source of truth for all learning modules.
// Adding a new volume/lab/mission = adding one entry here.
// ===========================================================

export type Difficulty = 'Initiate' | 'Operator' | 'Specialist' | 'Architect';
export type ModuleStatus = 'locked' | 'available' | 'active' | 'complete';

export interface VolumeMeta {
  id: string;
  slug: string;
  roman: string;
  title: string;
  subtitle: string;
  level: string;
  accent: 'neon' | 'cyan';
  chapters: number;
  estHours: number;
  blurb: string;
}

export interface LabMeta {
  id: string;
  slug: string;
  title: string;
  category: string;
  icon: string; // lucide icon name
  difficulty: Difficulty;
  estMinutes: number;
  blurb: string;
  tags: string[];
}

export interface MissionMeta {
  id: string;
  slug: string;
  title: string;
  codename: string;
  difficulty: Difficulty;
  estMinutes: number;
  progress: number; // 0-100
  status: ModuleStatus;
  briefing: string;
  objectives: string[];
  reward: number; // XP
}

export const VOLUMES: VolumeMeta[] = [
  {
    id: 'v1',
    slug: 'volume1',
    roman: 'I',
    title: 'Foundations',
    subtitle: 'The bedrock of modern cybersecurity',
    level: 'Beginner',
    accent: 'neon',
    chapters: 12,
    estHours: 40,
    blurb: 'Operating systems, networking, the command line, and the mental models every operator needs before touching a tool.',
  },
  {
    id: 'v2',
    slug: 'volume2',
    roman: 'II',
    title: 'Advanced',
    subtitle: 'Where theory becomes tradecraft',
    level: 'Intermediate',
    accent: 'cyan',
    chapters: 14,
    estHours: 55,
    blurb: 'Packet analysis, exploitation primitives, privilege escalation, and the discipline of structured reconnaissance.',
  },
  {
    id: 'v3',
    slug: 'volume3',
    roman: 'III',
    title: 'Professional',
    subtitle: 'Operating at the level of a paid operator',
    level: 'Advanced',
    accent: 'neon',
    chapters: 16,
    estHours: 70,
    blurb: 'Red team operations, detection engineering, cloud attack chains, and the business of adversary emulation.',
  },
  {
    id: 'v4',
    slug: 'volume4',
    roman: 'IV',
    title: 'Real Projects',
    subtitle: 'Build, break, and defend real systems',
    level: 'Advanced',
    accent: 'cyan',
    chapters: 10,
    estHours: 60,
    blurb: 'End-to-end engagements: from scoping a real target to delivering a report a client will actually act on.',
  },
  {
    id: 'v5',
    slug: 'volume5',
    roman: 'V',
    title: 'Cyber Range',
    subtitle: 'A live environment to operate against',
    level: 'Expert',
    accent: 'neon',
    chapters: 8,
    estHours: 80,
    blurb: 'A persistent, evolving range of targets and defenders. The closest thing to a live engagement without a contract.',
  },
];

export const LABS: LabMeta[] = [
  { id: 'l1', slug: 'linux', title: 'Linux', category: 'Systems', icon: 'Terminal', difficulty: 'Initiate', estMinutes: 45, blurb: 'Shell fluency, file systems, permissions, and process control.', tags: ['bash', 'filesystem', 'processes'] },
  { id: 'l2', slug: 'networking', title: 'Networking', category: 'Systems', icon: 'Network', difficulty: 'Initiate', estMinutes: 60, blurb: 'The OSI model made physical: addressing, routing, and capture.', tags: ['tcp/ip', 'routing', 'osi'] },
  { id: 'l3', slug: 'wireshark', title: 'Wireshark', category: 'Analysis', icon: 'Waves', difficulty: 'Operator', estMinutes: 50, blurb: 'Read the wire. Dissect frames, follow streams, find the signal.', tags: ['pcap', 'dissection', 'forensics'] },
  { id: 'l4', slug: 'nmap', title: 'Nmap', category: 'Recon', icon: 'Radar', difficulty: 'Operator', estMinutes: 40, blurb: 'Structured host discovery, service fingerprinting, and NSE scripting.', tags: ['scan', 'fingerprint', 'nse'] },
  { id: 'l5', slug: 'termux', title: 'Termux', category: 'Mobile', icon: 'Smartphone', difficulty: 'Initiate', estMinutes: 30, blurb: 'A pocket cyberdeck: a real Linux environment on Android.', tags: ['android', 'pocket', 'cli'] },
  { id: 'l6', slug: 'kali', title: 'Kali', category: 'Distro', icon: 'Swords', difficulty: 'Operator', estMinutes: 35, blurb: 'The operator’s toolkit, organized. Workflow over memorization.', tags: ['distro', 'toolkit', 'workflow'] },
  { id: 'l7', slug: 'esp32', title: 'ESP32', category: 'Hardware', icon: 'Cpu', difficulty: 'Specialist', estMinutes: 70, blurb: 'Embedded attack surfaces: Wi-Fi, BLE, and firmware analysis.', tags: ['embedded', 'wifi', 'firmware'] },
  { id: 'l8', slug: 'docker', title: 'Docker', category: 'Infra', icon: 'Container', difficulty: 'Operator', estMinutes: 55, blurb: 'Containers as targets and as safe ranges. Escape and defend.', tags: ['containers', 'escape', 'isolation'] },
  { id: 'l9', slug: 'python', title: 'Python', category: 'Tooling', icon: 'Code2', difficulty: 'Operator', estMinutes: 65, blurb: 'Build your own tools. Automation is the difference between script kiddie and operator.', tags: ['automation', 'scripts', 'tooling'] },
  { id: 'l10', slug: 'cloud', title: 'Cloud', category: 'Infra', icon: 'Cloud', difficulty: 'Architect', estMinutes: 80, blurb: 'IAM, misconfigurations, and attack chains across AWS, GCP, and Azure.', tags: ['aws', 'iam', 'misconfig'] },
];

export const MISSIONS: MissionMeta[] = [
  {
    id: 'm1',
    slug: 'mission1',
    title: 'First Light',
    codename: 'OP. SENTRY',
    difficulty: 'Initiate',
    estMinutes: 25,
    progress: 0,
    status: 'available',
    briefing: 'Establish a foothold on an exposed host and enumerate the immediate network neighborhood.',
    objectives: [
      'Identify live hosts on the 10.10.0.0/24 range',
      'Fingerprint the exposed services on the target',
      'Document findings in your operator notebook',
    ],
    reward: 150,
  },
  {
    id: 'm2',
    slug: 'mission2',
    title: 'Wire Witness',
    codename: 'OP. TAPER',
    difficulty: 'Operator',
    estMinutes: 45,
    progress: 0,
    status: 'available',
    briefing: 'A captured packet stream hides a credential exchange. Recover it and explain the protocol weakness.',
    objectives: [
      'Capture and filter traffic to the target host',
      'Reconstruct the credential exchange from the stream',
      'Write a one-paragraph protocol critique',
    ],
    reward: 300,
  },
  {
    id: 'm3',
    slug: 'mission3',
    title: 'Containment Breach',
    codename: 'OP. SIEVE',
    difficulty: 'Specialist',
    estMinutes: 70,
    progress: 0,
    status: 'locked',
    briefing: 'A misconfigured container runtime offers an escape path. Demonstrate the break and the fix.',
    objectives: [
      'Enumerate the container runtime capabilities',
      'Achieve a documented escape to the host',
      'Propose a hardened runtime configuration',
    ],
    reward: 600,
  },
];

export const ACHIEVEMENTS = [
  { id: 'a1', title: 'Boot Sequence', desc: 'Complete your first system boot.', xp: 50, tier: 'bronze', progress: 100 },
  { id: 'a2', title: 'First Contact', desc: 'Open your first volume in the Library.', xp: 75, tier: 'bronze', progress: 0 },
  { id: 'a3', title: 'Wire Reader', desc: 'Finish the Wireshark lab.', xp: 150, tier: 'silver', progress: 0 },
  { id: 'a4', title: 'Mission Ready', desc: 'Complete your first mission.', xp: 200, tier: 'silver', progress: 0 },
  { id: 'a5', title: 'Notekeeper', desc: 'Save 25 notes in your notebook.', xp: 120, tier: 'bronze', progress: 0 },
  { id: 'a6', title: 'Range Operator', desc: 'Reach Volume V — the Cyber Range.', xp: 500, tier: 'gold', progress: 0 },
  { id: 'a7', title: 'Centurion', desc: 'Earn 1000 XP across all modules.', xp: 0, tier: 'gold', progress: 0 },
  { id: 'a8', title: 'Architect', desc: 'Complete a Real Projects engagement.', xp: 800, tier: 'platinum', progress: 0 },
] as const;

export const SIDEBAR_NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', group: 'core' },
  { id: 'library', label: 'Library', icon: 'Library', group: 'core' },
  { id: 'labs', label: 'Labs', icon: 'FlaskConical', group: 'core' },
  { id: 'missions', label: 'Missions', icon: 'Crosshair', group: 'core' },
  { id: 'downloads', label: 'Downloads', icon: 'Download', group: 'core' },
  { id: 'beta', label: 'Beta Labs', icon: 'AlertTriangle', group: 'core' },
  { id: 'achievements', label: 'Achievements', icon: 'Trophy', group: 'progress' },
  { id: 'notes', label: 'Notes', icon: 'StickyNote', group: 'progress' },
  { id: 'search', label: 'Search', icon: 'Search', group: 'tools' },
  { id: 'settings', label: 'Settings', icon: 'Settings', group: 'tools' },
  { id: 'about', label: 'About', icon: 'Info', group: 'tools' },
] as const;

export type SidebarItem = (typeof SIDEBAR_NAV)[number];
