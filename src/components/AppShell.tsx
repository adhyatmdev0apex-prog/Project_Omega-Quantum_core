import { useState, type ReactNode } from 'react';
import { useRouter } from '../state/router';
import { SIDEBAR_NAV } from '../data/modules';
import { Icon } from '../components/Icon';
import { cn } from '../lib/cn';
import { SystemMonitor } from './SystemMonitor';
import { StatusBar } from './StatusBar';

// ===========================================================
// AppShell — the 4-region dashboard scaffold shared by every
// authenticated page: sidebar (L), content (C), monitor (R), status (B).
//
// workspace={true}: removes all max-w / padding constraints so
// iframe-based labs can fill 100% of the available viewport.
// The left sidebar still collapses, naturally expanding the workspace.
// ===========================================================

export function AppShell({ children, workspace = false }: { children: ReactNode; workspace?: boolean }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { path, navigate } = useRouter();

  const active = path.split('/').filter(Boolean)[0] ?? 'dashboard';

  const go = (id: string) => {
    navigate(`/${id}`);
    setMobileOpen(false);
  };

  return (
    <div className="relative z-10 flex h-screen flex-col overflow-hidden">
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-white/5 bg-ink-900/80 px-4 py-3 backdrop-blur-xl md:hidden">
        <button onClick={() => setMobileOpen(true)} className="qc-focus rounded-lg p-1.5 text-slate-300 hover:text-white">
          <Icon name="Menu" size={20} />
        </button>
        <Brand compact />
        <div className="w-9" />
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Sidebar — desktop */}
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          active={active}
          onNavigate={go}
          className="hidden md:flex"
        />

        {/* Sidebar — mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-72 animate-fade-up">
              <Sidebar active={active} onNavigate={go} onClose={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        {/* Center content */}
        <main
          id="qc-main"
          className={cn(
            'min-w-0 min-h-0 flex-1',
            workspace
              ? 'flex min-h-0 flex-col overflow-hidden'
              : 'overflow-y-auto px-4 py-6 md:px-8 md:py-8',
          )}
>
          {workspace
            ? children
            : <div className="mx-auto max-w-5xl">{children}</div>
          }
        </main>

        {/* Right — system monitor (desktop, hidden in workspace mode) */}
        {!workspace && (
          <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-white/5 bg-ink-900/40 p-4 backdrop-blur-xl xl:block">
            <SystemMonitor />
          </aside>
        )}
      </div>

      {/* Bottom — status bar */}
      <StatusBar />
    </div>
  );
}

function Sidebar({
  collapsed,
  onToggle,
  active,
  onNavigate,
  onClose,
  className,
}: {
  collapsed?: boolean;
  onToggle?: () => void;
  active: string;
  onNavigate: (id: string) => void;
  onClose?: () => void;
  className?: string;
}) {
  const groups = ['core', 'progress', 'tools', 'dev'] as const;
  const groupLabel: Record<string, string> = { core: 'Core', progress: 'Progress', tools: 'Tools', dev: 'Developer' };

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col border-r border-white/5 bg-ink-900/60 backdrop-blur-xl',
        collapsed ? 'w-16' : 'w-64',
        className,
      )}
    >
      <div className={cn('flex items-center gap-2 px-4 py-5', collapsed && 'justify-center')}>
        {collapsed ? <BrandMark /> : <Brand />}
        {onClose && (
          <button onClick={onClose} className="ml-auto rounded-lg p-1 text-slate-400 hover:text-white md:hidden">
            <Icon name="X" size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2 no-scrollbar">
        {groups.map((g) => (
          <div key={g} className="mb-4">
            {!collapsed && (
              <div className={cn(
                'px-3 pb-1.5 font-mono text-[10px] uppercase tracking-[0.2em]',
                g === 'dev' ? 'text-cyan-600' : 'text-slate-600'
              )}>
                {groupLabel[g]}
              </div>
            )}
            <ul className="space-y-0.5">
              {SIDEBAR_NAV.filter((n) => n.group === g).map((item) => {
                const isActive = active === item.id;
                const isDevItem = item.group === 'dev';
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => onNavigate(item.id)}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all qc-focus',
                        collapsed && 'justify-center',
                        isActive && item.id === 'beta'
                          ? 'bg-warn-400/10 text-warn-200'
                          : isActive && isDevItem
                          ? 'bg-cyan-400/10 text-cyan-200'
                          : isActive
                          ? 'bg-neon-400/10 text-neon-200'
                          : isDevItem
                          ? 'text-slate-500 hover:bg-cyan-400/5 hover:text-cyan-300'
                          : 'text-slate-400 hover:bg-white/5 hover:text-white',
                      )}
                    >
                      {isActive && (
                        <span className={cn(
                          'absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full',
                          item.id === 'beta' ? 'bg-warn-400' : isDevItem ? 'bg-cyan-400' : 'bg-neon-400 shadow-glow',
                        )} />
                      )}
                      <Icon
                        name={item.icon}
                        size={18}
                        className={cn(
                          'shrink-0 transition-colors',
                          isActive
                            ? item.id === 'beta' ? 'text-warn-400' : isDevItem ? 'text-cyan-400' : 'text-neon-400'
                            : item.id === 'beta' ? 'text-warn-500 group-hover:text-warn-400' : isDevItem ? 'text-cyan-600 group-hover:text-cyan-400' : 'text-slate-500 group-hover:text-neon-300',
                        )}
                      />
                      {!collapsed && (
                        <span className="flex flex-1 items-center justify-between font-medium">
                          {item.label}
                          {item.id === 'beta' && (
                            <span className="rounded-full border border-warn-400/30 bg-warn-400/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-warn-400">
                              beta
                            </span>
                          )}
                          {isDevItem && (
                            <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-cyan-400">
                              dev
                            </span>
                          )}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Future modules slot */}
      <div className={cn('border-t border-white/5 p-3', collapsed && 'px-2')}>
        {!collapsed ? (
          <button
            onClick={() => onNavigate('about')}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-500 hover:text-neon-300"
          >
            <Icon name="Sparkles" size={14} />
            Future Modules
          </button>
        ) : (
          <button onClick={() => onNavigate('about')} className="mx-auto block rounded-lg p-2 text-slate-500 hover:text-neon-300">
            <Icon name="Sparkles" size={16} />
          </button>
        )}
      </div>

      {onToggle && (
        <button
          onClick={onToggle}
          className="hidden border-t border-white/5 px-4 py-3 text-slate-500 hover:text-white md:flex"
        >
          <Icon name={collapsed ? 'ChevronRight' : 'ChevronDown'} size={16} className={cn(!collapsed && 'rotate-90')} />
          {!collapsed && <span className="ml-2 font-mono text-[11px] uppercase tracking-wider">Collapse</span>}
        </button>
      )}
    </aside>
  );
}

function Brand({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <BrandMark />
      {!compact && (
        <div className="leading-tight">
          <div className="font-display text-sm font-bold tracking-tight text-white">
            QUANTUM<span className="text-neon-400"> CORE</span>
          </div>
          <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-cyan-300/60">Learning OS</div>
        </div>
      )}
    </div>
  );
}

function BrandMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 120 120" className="shrink-0 drop-shadow-[0_0_10px_rgba(57,255,20,0.4)]">
      <circle cx="60" cy="60" r="40" fill="none" stroke="#39ff14" strokeWidth="3" opacity="0.9" />
      <circle cx="60" cy="60" r="22" fill="none" stroke="#00f0ff" strokeWidth="2" opacity="0.8" />
      <circle cx="60" cy="60" r="5" fill="#39ff14" />
    </svg>
  );
}
