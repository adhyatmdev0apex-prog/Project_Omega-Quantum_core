import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

// ===========================================================
// Global settings store — persisted to localStorage.
// Drives body data-attributes consumed by index.css.
// ===========================================================

export interface Settings {
  fontScale: number; // 0.9 | 1 | 1.1 | 1.25
  animations: boolean;
  particles: boolean;
  matrix: boolean;
  theme: 'core' | 'cyan'; // accent flavor
}

const DEFAULTS: Settings = {
  fontScale: 1,
  animations: true,
  particles: true,
  matrix: true,
  theme: 'core',
};

const KEY = 'qc.settings.v1';

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

interface SettingsCtx {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
}

const Ctx = createContext<SettingsCtx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => load());

  useEffect(() => {
    const root = document.body;
    root.style.setProperty('--qc-font-scale', String(settings.fontScale));
    root.dataset.anim = settings.animations ? '1' : '0';
    root.dataset.particles = settings.particles ? '1' : '0';
    root.dataset.matrix = settings.matrix ? '1' : '0';
    root.dataset.theme = settings.theme;
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {
      /* ignore quota */
    }
  }, [settings]);

  const value = useMemo<SettingsCtx>(
    () => ({
      settings,
      update: (patch) => setSettings((s) => ({ ...s, ...patch })),
      reset: () => setSettings(DEFAULTS),
    }),
    [settings],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSettings() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
