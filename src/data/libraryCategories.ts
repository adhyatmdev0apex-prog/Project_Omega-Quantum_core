// ===========================================================
// Library category registry — top-level domains inside the
// Library (Cyber Security, ESP-32, ...). Adding a new domain =
// adding one entry here + one content component in App.tsx's
// library route switch. Does not touch VOLUMES or any existing
// Cyber Security data.
// ===========================================================

export interface LibraryCategoryMeta {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string; // lucide icon name (see Icon.tsx registry)
  accent: 'neon' | 'cyan';
  status: 'active' | 'coming-soon';
}

export const LIBRARY_CATEGORIES: LibraryCategoryMeta[] = [
  {
    id: 'cyber-security',
    slug: 'cyber',
    title: 'Cyber Security',
    subtitle: 'Quantum Core Curriculum',
    description:
      'Foundations, Advanced, Professional, Real Projects, and the Cyber Range — the complete five-volume path from first principles to live offensive/defensive practice.',
    icon: 'Shield',
    accent: 'neon',
    status: 'coming-soon',
  },
  {
    id: 'esp32',
    slug: 'esp32',
    title: 'ESP-32',
    subtitle: 'Embedded Systems',
    description:
      'Microcontroller fundamentals, firmware, and hands-on embedded builds. Guides land here as they are written.',
    icon: 'Cpu',
    accent: 'cyan',
    status: 'active',
  },
];
