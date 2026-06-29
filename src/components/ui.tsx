import { type ReactNode, type ButtonHTMLAttributes, type HTMLAttributes } from 'react';
import { cn } from '../lib/cn';

// ===========================================================
// Reusable UI primitives — the visual vocabulary of Quantum Core.
// No duplicated styling; everything composes the classes in index.css.
// ===========================================================

export function GlassPanel({
  children,
  className,
  variant = 'default',
  hover = false,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'cyan';
  hover?: boolean;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'glass',
        variant === 'cyan' && 'glass-cyan',
        hover && 'glass-hover',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function NeonButton({
  children,
  variant = 'neon',
  className,
  ...rest
}: {
  children: ReactNode;
  variant?: 'neon' | 'cyan' | 'ghost';
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = variant === 'cyan' ? 'btn-cyan' : variant === 'ghost' ? 'btn-ghost' : 'btn-neon';
  return (
    <button className={cn(cls, 'qc-focus', className)} {...rest}>
      {children}
    </button>
  );
}

export function Chip({
  children,
  variant = 'default',
  className,
}: {
  children: ReactNode;
  variant?: 'default' | 'neon' | 'cyan' | 'warn' | 'err';
  className?: string;
}) {
  const cls =
    variant === 'neon' ? 'chip-neon' : variant === 'cyan' ? 'chip-cyan' : variant === 'warn' ? 'chip-warn' : variant === 'err' ? 'chip-err' : '';
  return <span className={cn('chip', cls, className)}>{children}</span>;
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('qc-bar', className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <div className="section-eyebrow mb-1.5">{eyebrow}</div>}
        <h2 className="section-title">{title}</h2>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-slate-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatTile({
  label,
  value,
  sub,
  accent = 'neon',
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  accent?: 'neon' | 'cyan';
}) {
  return (
    <GlassPanel className="p-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <div
        className={cn(
          'mt-1 font-display text-2xl font-semibold',
          accent === 'neon' ? 'text-neon-300 text-glow' : 'text-cyan-300 text-glow-cyan',
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-slate-500">{sub}</div>}
    </GlassPanel>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center">
      {icon && <div className="mb-4 text-slate-600">{icon}</div>}
      <h3 className="font-display text-lg text-slate-300">{title}</h3>
      {description && <p className="mt-1.5 max-w-md text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-md border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[11px] text-slate-300">
      {children}
    </kbd>
  );
}
