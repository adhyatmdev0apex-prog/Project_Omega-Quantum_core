// ===========================================================
// FeedbackPanel — comprehensive feedback collection for beta labs.
// Stores submissions in localStorage. Shows recent feedback below.
// ===========================================================

import { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { GlassPanel, NeonButton } from './ui';
import { cn } from '../lib/cn';
import type { BetaLab } from '../data/betaLabs';

// ── Types ───────────────────────────────────────────────────

interface CategoryRatings {
  ui: number;
  learning: number;
  realism: number;
  easeOfUse: number;
  performance: number;
  fun: number;
}

interface FeedbackSubmission {
  id: string;
  timestamp: string;
  labId: string;
  labTitle: string;
  version: string;
  overallRating: number;
  ratingReason: string;
  categoryRatings: CategoryRatings;
  likedMost: string;
  improvements: string;
  bugReport: string;
  featureRequests: string;
}

const STORAGE_KEY = 'quantum-core.beta-feedback';

const DEFAULT_CATEGORIES: CategoryRatings = {
  ui: 0,
  learning: 0,
  realism: 0,
  easeOfUse: 0,
  performance: 0,
  fun: 0,
};

const CATEGORY_LABELS: Record<keyof CategoryRatings, string> = {
  ui: 'UI Design',
  learning: 'Learning Experience',
  realism: 'Realism',
  easeOfUse: 'Ease of Use',
  performance: 'Performance',
  fun: 'Fun',
};

// ── Component ───────────────────────────────────────────────

interface FeedbackPanelProps {
  lab: BetaLab;
  className?: string;
}

export function FeedbackPanel({ lab, className }: FeedbackPanelProps) {
  const [overallRating, setOverallRating] = useState(0);
  const [ratingReason, setRatingReason] = useState('');
  const [categoryRatings, setCategoryRatings] = useState<CategoryRatings>({ ...DEFAULT_CATEGORIES });
  const [likedMost, setLikedMost] = useState('');
  const [improvements, setImprovements] = useState('');
  const [bugReport, setBugReport] = useState('');
  const [featureRequests, setFeatureRequests] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [recentFeedback, setRecentFeedback] = useState<FeedbackSubmission[]>([]);

  // Load recent feedback on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const all: FeedbackSubmission[] = JSON.parse(stored);
        setRecentFeedback(all.filter((f) => f.labId === lab.id).slice(0, 5));
      } catch { /* ignore */ }
    }
  }, [lab.id]);

  const canSubmit =
    overallRating > 0 &&
    ratingReason.trim().length >= 20;

  const handleSubmit = () => {
    if (!canSubmit) return;

    setSubmitting(true);

    const submission: FeedbackSubmission = {
      id: `fb-${Date.now()}`,
      timestamp: new Date().toISOString(),
      labId: lab.id,
      labTitle: lab.title,
      version: lab.version,
      overallRating,
      ratingReason: ratingReason.trim(),
      categoryRatings,
      likedMost: likedMost.trim(),
      improvements: improvements.trim(),
      bugReport: bugReport.trim(),
      featureRequests: featureRequests.trim(),
    };

    // Save to localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    const existing: FeedbackSubmission[] = stored ? JSON.parse(stored) : [];
    const updated = [submission, ...existing].slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Reset form
    setOverallRating(0);
    setRatingReason('');
    setCategoryRatings({ ...DEFAULT_CATEGORIES });
    setLikedMost('');
    setImprovements('');
    setBugReport('');
    setFeatureRequests('');
    setSubmitting(false);
    setSubmitted(true);
    setRecentFeedback([submission, ...recentFeedback].slice(0, 5));

    // Reset submitted state after 3s
    setTimeout(() => setSubmitted(false), 3000);
  };

  const updateCategory = (key: keyof CategoryRatings, value: number) => {
    setCategoryRatings((prev) => ({ ...prev, [key]: value }));
  };

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
      <div className="space-y-2">
        <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-300">
          Overall Rating <span className="text-warn-400">*</span>
        </label>
        <StarRating value={overallRating} onChange={setOverallRating} size="lg" />
        {overallRating === 0 && (
          <p className="text-xs text-warn-400">Rating is required before submission.</p>
        )}
      </div>

      {/* Rating Reason */}
      <div className="space-y-2">
        <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-300">
          Why did you give this rating? <span className="text-warn-400">*</span>
        </label>
        <textarea
          value={ratingReason}
          onChange={(e) => setRatingReason(e.target.value)}
          placeholder="Explain why you chose this rating.

Examples:
• The animations are smooth but confusing.
• The terminal feels realistic.
• Packet movement is too fast.
• I couldn't understand what the router was doing."
          className={cn(
            'w-full resize-none rounded-lg border border-white/10 bg-white/[0.02] p-3',
            'text-sm text-slate-200 placeholder-slate-600',
            'transition-colors',
            'focus:border-neon-400/50 focus:outline-none focus:ring-1 focus:ring-neon-400/30'
          )}
          rows={5}
        />
        <div className="flex justify-between text-xs">
          <span className={ratingReason.trim().length >= 20 ? 'text-neon-400' : 'text-slate-500'}>
            {ratingReason.trim().length} / 20 min
          </span>
          {ratingReason.trim().length < 20 && ratingReason.length > 0 && (
            <span className="text-warn-400">At least 20 characters required.</span>
          )}
        </div>
      </div>

      {/* Category Ratings */}
      <div className="space-y-3">
        <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-300">
          Category Ratings
        </label>
        {(Object.keys(categoryRatings) as (keyof CategoryRatings)[]).map((key) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm text-slate-400">{CATEGORY_LABELS[key]}</span>
            <StarRating value={categoryRatings[key]} onChange={(v) => updateCategory(key, v)} />
          </div>
        ))}
      </div>

      {/* Liked Most */}
      <div className="space-y-2">
        <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-300">
          What did you like most?
        </label>
        <textarea
          value={likedMost}
          onChange={(e) => setLikedMost(e.target.value)}
          placeholder="Which feature impressed you the most?"
          className={cn(
            'w-full resize-none rounded-lg border border-white/10 bg-white/[0.02] p-3',
            'text-sm text-slate-200 placeholder-slate-600',
            'transition-colors',
            'focus:border-neon-400/50 focus:outline-none focus:ring-1 focus:ring-neon-400/30'
          )}
          rows={3}
        />
      </div>

      {/* Improvements */}
      <div className="space-y-2">
        <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-300">
          What should be improved?
        </label>
        <textarea
          value={improvements}
          onChange={(e) => setImprovements(e.target.value)}
          placeholder="If you were the developer, what would you improve first?"
          className={cn(
            'w-full resize-none rounded-lg border border-white/10 bg-white/[0.02] p-3',
            'text-sm text-slate-200 placeholder-slate-600',
            'transition-colors',
            'focus:border-neon-400/50 focus:outline-none focus:ring-1 focus:ring-neon-400/30'
          )}
          rows={3}
        />
      </div>

      {/* Bug Report */}
      <div className="space-y-2">
        <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-300">
          Bug Report
        </label>
        <textarea
          value={bugReport}
          onChange={(e) => setBugReport(e.target.value)}
          placeholder="Did anything break? Did a command not work? Did animations freeze?"
          className={cn(
            'w-full resize-none rounded-lg border border-white/10 bg-white/[0.02] p-3',
            'text-sm text-slate-200 placeholder-slate-600',
            'transition-colors',
            'focus:border-neon-400/50 focus:outline-none focus:ring-1 focus:ring-neon-400/30'
          )}
          rows={3}
        />
      </div>

      {/* Feature Requests */}
      <div className="space-y-2">
        <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-300">
          Feature Requests
        </label>
        <textarea
          value={featureRequests}
          onChange={(e) => setFeatureRequests(e.target.value)}
          placeholder="What would you love to see added?

Examples:
• More commands
• Better packet animations
• Wireshark mode
• Darker theme"
          className={cn(
            'w-full resize-none rounded-lg border border-white/10 bg-white/[0.02] p-3',
            'text-sm text-slate-200 placeholder-slate-600',
            'transition-colors',
            'focus:border-neon-400/50 focus:outline-none focus:ring-1 focus:ring-neon-400/30'
          )}
          rows={3}
        />
      </div>

      {/* Submit */}
      <NeonButton
        onClick={handleSubmit}
        disabled={!canSubmit || submitting}
        className="w-full justify-center"
      >
        {submitting ? (
          <span className="flex items-center gap-2">
            <Icon name="Loader2" size={14} className="animate-spin" /> Submitting...
          </span>
        ) : submitted ? (
          <span className="flex items-center gap-2">
            <Icon name="Check" size={14} /> Submitted!
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Icon name="Send" size={14} /> Submit Feedback
          </span>
        )}
      </NeonButton>

      {/* Recent Feedback */}
      {recentFeedback.length > 0 && (
        <div className="space-y-4 pt-4">
          <h4 className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
            Recent Feedback
          </h4>
          {recentFeedback.map((fb) => (
            <FeedbackCard key={fb.id} feedback={fb} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Star Rating Component ───────────────────────────────────

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  size?: 'sm' | 'lg';
}

function StarRating({ value, onChange, size = 'sm' }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  return (
    <div
      className="flex gap-0.5"
      onMouseLeave={() => setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hovered || value);
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            className={cn(
              'transition-transform duration-150',
              size === 'lg' ? 'p-0.5' : 'p-0',
              'hover:scale-110'
            )}
          >
            <Icon
              name="Star"
              size={size === 'lg' ? 22 : 16}
              className={cn(
                filled ? 'text-warn-400 fill-warn-400' : 'text-slate-600',
                'transition-colors'
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

// ── Feedback Card Component ────────────────────────────────

function FeedbackCard({ feedback }: { feedback: FeedbackSubmission }) {
    const [expanded, setExpanded] = useState(false);

  const timeAgo = (iso: string): string => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <GlassPanel className="p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Icon
                key={star}
                name="Star"
                size={12}
                className={star <= feedback.overallRating ? 'text-warn-400 fill-warn-400' : 'text-slate-700'}
              />
            ))}
          </div>
          <span className="font-mono text-[10px] text-slate-500">
            {timeAgo(feedback.timestamp)}
          </span>
        </div>
        <span className="font-mono text-[10px] text-slate-600">{feedback.version}</span>
      </div>

      {/* Rating Reason */}
      <p className="mt-2 text-sm text-slate-300 line-clamp-2">{feedback.ratingReason}</p>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="mt-2 font-mono text-[10px] text-cyan-400 hover:text-cyan-300"
      >
        {expanded ? 'Show less' : 'Show more'}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="mt-3 space-y-3 border-t border-white/5 pt-3">
          {/* Category Ratings */}
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(feedback.categoryRatings) as (keyof CategoryRatings)[]).map((key) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{CATEGORY_LABELS[key]}</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Icon
                      key={star}
                      name="Star"
                      size={10}
                      className={star <= feedback.categoryRatings[key] ? 'text-warn-400 fill-warn-400' : 'text-slate-700'}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Optional fields */}
          {feedback.likedMost && (
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Liked Most</span>
              <p className="mt-1 text-sm text-slate-400">{feedback.likedMost}</p>
            </div>
          )}
          {feedback.improvements && (
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Improvements</span>
              <p className="mt-1 text-sm text-slate-400">{feedback.improvements}</p>
            </div>
          )}
          {feedback.bugReport && (
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-err-400">Bug Report</span>
              <p className="mt-1 text-sm text-slate-400">{feedback.bugReport}</p>
            </div>
          )}
          {feedback.featureRequests && (
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-cyan-400">Feature Requests</span>
              <p className="mt-1 text-sm text-slate-400">{feedback.featureRequests}</p>
            </div>
          )}
        </div>
      )}
    </GlassPanel>
  );
}
