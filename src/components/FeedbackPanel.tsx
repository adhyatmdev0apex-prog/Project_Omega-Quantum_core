// ===========================================================
// FeedbackPanel — comprehensive feedback for any beta project.
// Submissions stored in localStorage, shown as collapsible cards.
// ===========================================================

import { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { GlassPanel, NeonButton } from './ui';
import { cn } from '../lib/cn';
import type { BetaProject } from '../data/betaLabs';

// ── Types ────────────────────────────────────────────────────

interface CategoryRatings {
  ui: number;
  learning: number;
  realism: number;
  easeOfUse: number;
  performance: number;
  fun: number;
}

export interface FeedbackSubmission {
  id: string;
  timestamp: string;
  projectSlug: string;
  projectTitle: string;
  version: string;
  overallRating: number;
  ratingReason: string;
  categoryRatings: CategoryRatings;
  likedMost: string;
  improvements: string;
  bugReport: string;
  featureRequests: string;
}

const STORAGE_KEY = 'quantum-core.beta-feedback-v2';

const DEFAULT_CATEGORIES: CategoryRatings = {
  ui: 0, learning: 0, realism: 0, easeOfUse: 0, performance: 0, fun: 0,
};

const CATEGORY_LABELS: Record<keyof CategoryRatings, string> = {
  ui: 'UI Design',
  learning: 'Learning Experience',
  realism: 'Realism',
  easeOfUse: 'Ease of Use',
  performance: 'Performance',
  fun: 'Fun',
};

// ── Component ────────────────────────────────────────────────

interface FeedbackPanelProps {
  project: BetaProject;
  className?: string;
}

export function FeedbackPanel({ project, className }: FeedbackPanelProps) {
  const [overallRating, setOverallRating]         = useState(0);
  const [ratingReason, setRatingReason]           = useState('');
  const [categoryRatings, setCategoryRatings]     = useState<CategoryRatings>({ ...DEFAULT_CATEGORIES });
  const [likedMost, setLikedMost]                 = useState('');
  const [improvements, setImprovements]           = useState('');
  const [bugReport, setBugReport]                 = useState('');
  const [featureRequests, setFeatureRequests]     = useState('');
  const [submitting, setSubmitting]               = useState(false);
  const [submitted, setSubmitted]                 = useState(false);
  const [recentFeedback, setRecentFeedback]       = useState<FeedbackSubmission[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const all: FeedbackSubmission[] = JSON.parse(stored);
        setRecentFeedback(all.filter((f) => f.projectSlug === project.slug).slice(0, 5));
      } catch { /* ignore */ }
    }
  }, [project.slug]);

  const canSubmit = overallRating > 0 && ratingReason.trim().length >= 20;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);

    const submission: FeedbackSubmission = {
      id: `fb-${Date.now()}`,
      timestamp: new Date().toISOString(),
      projectSlug: project.slug,
      projectTitle: project.title,
      version: project.version,
      overallRating,
      ratingReason: ratingReason.trim(),
      categoryRatings,
      likedMost: likedMost.trim(),
      improvements: improvements.trim(),
      bugReport: bugReport.trim(),
      featureRequests: featureRequests.trim(),
    };

    const stored = localStorage.getItem(STORAGE_KEY);
    const existing: FeedbackSubmission[] = stored ? JSON.parse(stored) : [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify([submission, ...existing].slice(0, 50)));

    setOverallRating(0);
    setRatingReason('');
    setCategoryRatings({ ...DEFAULT_CATEGORIES });
    setLikedMost('');
    setImprovements('');
    setBugReport('');
    setFeatureRequests('');
    setSubmitting(false);
    setSubmitted(true);
    setRecentFeedback((prev) => [submission, ...prev].slice(0, 5));
    setTimeout(() => setSubmitted(false), 3000);
  };

  const updateCategory = (key: keyof CategoryRatings, value: number) =>
    setCategoryRatings((prev) => ({ ...prev, [key]: value }));

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="space-y-2">
        <h3 className="font-display text-lg font-semibold text-white">Developer Feedback</h3>
        <p className="text-sm leading-relaxed text-slate-400">
          This simulator is still under development. Your feedback directly helps shape Quantum Core.
          Please be honest — every suggestion is read before new versions are released.
        </p>
      </div>

      {/* Overall Rating */}
      <FormBlock label="Overall Rating" required>
        <StarRating value={overallRating} onChange={setOverallRating} size="lg" />
        {overallRating === 0 && (
          <p className="mt-1 text-xs text-warn-400">Rating is required before submission.</p>
        )}
      </FormBlock>

      {/* Rating Reason */}
      <FormBlock label="Why did you give this rating?" required>
        <Textarea
          value={ratingReason}
          onChange={setRatingReason}
          rows={5}
          placeholder={`Explain why you chose this rating.\n\nExamples:\n• The animations are smooth but confusing.\n• The terminal feels realistic.\n• Packet movement is too fast.\n• I couldn't understand what the router was doing.`}
        />
        <div className="mt-1 flex justify-between text-xs">
          <span className={ratingReason.trim().length >= 20 ? 'text-neon-400' : 'text-slate-500'}>
            {ratingReason.trim().length} / 20 min
          </span>
          {ratingReason.trim().length > 0 && ratingReason.trim().length < 20 && (
            <span className="text-warn-400">At least 20 characters required.</span>
          )}
        </div>
      </FormBlock>

      {/* Category Ratings */}
      <FormBlock label="Category Ratings">
        <div className="space-y-3">
          {(Object.keys(categoryRatings) as (keyof CategoryRatings)[]).map((key) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-slate-400">{CATEGORY_LABELS[key]}</span>
              <StarRating value={categoryRatings[key]} onChange={(v) => updateCategory(key, v)} />
            </div>
          ))}
        </div>
      </FormBlock>

      {/* Optional fields */}
      <FormBlock label="What did you like most?">
        <Textarea value={likedMost} onChange={setLikedMost} rows={3}
          placeholder="Which feature impressed you the most?" />
      </FormBlock>

      <FormBlock label="What should be improved?">
        <Textarea value={improvements} onChange={setImprovements} rows={3}
          placeholder="If you were the developer, what would you improve first?" />
      </FormBlock>

      <FormBlock label="Bug Report">
        <Textarea value={bugReport} onChange={setBugReport} rows={3}
          placeholder={"Did anything break? Did a command not work? Did animations freeze?"} />
      </FormBlock>

      <FormBlock label="Feature Requests">
        <Textarea value={featureRequests} onChange={setFeatureRequests} rows={3}
          placeholder={"What would you love to see added?\n\nExamples:\n• More commands\n• Better packet animations\n• Wireshark mode\n• Darker theme"} />
      </FormBlock>

      {/* Submit */}
      <NeonButton onClick={handleSubmit} disabled={!canSubmit || submitting} className="w-full justify-center">
        {submitting ? (
          <span className="flex items-center gap-2"><Icon name="Loader2" size={14} className="animate-spin" /> Submitting...</span>
        ) : submitted ? (
          <span className="flex items-center gap-2"><Icon name="Check" size={14} /> Submitted!</span>
        ) : (
          <span className="flex items-center gap-2"><Icon name="Send" size={14} /> Submit Feedback</span>
        )}
      </NeonButton>

      {/* Recent Feedback */}
      {recentFeedback.length > 0 && (
        <div className="space-y-4 pt-4">
          <h4 className="font-mono text-[11px] uppercase tracking-wider text-slate-500">Recent Feedback</h4>
          {recentFeedback.map((fb) => (
            <FeedbackCard key={fb.id} feedback={fb} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Primitives ────────────────────────────────────────────────

function FormBlock({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-300">
        {label} {required && <span className="text-warn-400">*</span>}
      </label>
      {children}
    </div>
  );
}

function Textarea({
  value, onChange, rows, placeholder,
}: { value: string; onChange: (v: string) => void; rows: number; placeholder: string }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={cn(
        'w-full resize-none rounded-lg border border-white/10 bg-white/[0.02] p-3',
        'text-sm text-slate-200 placeholder-slate-600',
        'focus:border-neon-400/50 focus:outline-none focus:ring-1 focus:ring-neon-400/30',
      )}
    />
  );
}

function StarRating({ value, onChange, size = 'sm' }: { value: number; onChange: (v: number) => void; size?: 'sm' | 'lg' }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hovered || value);
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            className={cn('transition-transform hover:scale-110', size === 'lg' ? 'p-0.5' : 'p-0')}
          >
            <Icon
              name="Star"
              size={size === 'lg' ? 22 : 16}
              className={cn(filled ? 'fill-warn-400 text-warn-400' : 'text-slate-600', 'transition-colors')}
            />
          </button>
        );
      })}
    </div>
  );
}

function FeedbackCard({ feedback }: { feedback: FeedbackSubmission }) {
  const [expanded, setExpanded] = useState(false);

  const timeAgo = (iso: string) => {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <GlassPanel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((s) => (
              <Icon key={s} name="Star" size={12}
                className={s <= feedback.overallRating ? 'fill-warn-400 text-warn-400' : 'text-slate-700'} />
            ))}
          </div>
          <span className="font-mono text-[10px] text-slate-500">{timeAgo(feedback.timestamp)}</span>
        </div>
        <span className="font-mono text-[10px] text-slate-600">{feedback.version}</span>
      </div>

      <p className="mt-2 line-clamp-2 text-sm text-slate-300">{feedback.ratingReason}</p>

      <button onClick={() => setExpanded((e) => !e)}
        className="mt-2 font-mono text-[10px] text-cyan-400 hover:text-cyan-300">
        {expanded ? 'Show less' : 'Show more'}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3 border-t border-white/5 pt-3">
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(feedback.categoryRatings) as (keyof CategoryRatings)[]).map((key) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{CATEGORY_LABELS[key]}</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Icon key={s} name="Star" size={10}
                      className={s <= feedback.categoryRatings[key] ? 'fill-warn-400 text-warn-400' : 'text-slate-700'} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          {feedback.likedMost && <ExpandedField label="Liked Most" value={feedback.likedMost} />}
          {feedback.improvements && <ExpandedField label="Improvements" value={feedback.improvements} />}
          {feedback.bugReport && <ExpandedField label="Bug Report" value={feedback.bugReport} accent="text-err-400" />}
          {feedback.featureRequests && <ExpandedField label="Feature Requests" value={feedback.featureRequests} accent="text-cyan-400" />}
        </div>
      )}
    </GlassPanel>
  );
}

function ExpandedField({ label, value, accent = 'text-slate-500' }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <span className={cn('font-mono text-[10px] uppercase tracking-wider', accent)}>{label}</span>
      <p className="mt-1 text-sm text-slate-400">{value}</p>
    </div>
  );
}
