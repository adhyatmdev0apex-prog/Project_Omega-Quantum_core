import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

// ===========================================================
// Minimal hash router — no external dependency.
// Routes: #/dashboard, #/library, #/library/volume1, etc.
// ===========================================================

interface RouterCtx {
  path: string; // e.g. "/dashboard"
  navigate: (to: string) => void;
}

const Ctx = createContext<RouterCtx | null>(null);

function currentPath(): string {
  const h = window.location.hash.replace(/^#/, '');
  return h || '/';
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState<string>(() => currentPath());

  useEffect(() => {
    const onHash = () => setPath(currentPath());
    window.addEventListener('hashchange', onHash);
    if (!window.location.hash) window.location.hash = '#/';
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = (to: string) => {
    const target = to.startsWith('#') ? to : `#${to}`;
    if (window.location.hash === target) {
      setPath(target.replace(/^#/, ''));
    } else {
      window.location.hash = target;
    }
    // scroll main content to top on navigation
    requestAnimationFrame(() => {
      const main = document.getElementById('qc-main');
      if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const value = useMemo<RouterCtx>(() => ({ path, navigate }), [path]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRouter() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}

// Convenience: parse path segments
export function useRoute(): { segments: string[]; path: string } {
  const { path } = useRouter();
  const segments = path.split('/').filter(Boolean);
  return { segments, path };
}
