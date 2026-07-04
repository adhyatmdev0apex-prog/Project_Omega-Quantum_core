// ===========================================================
// FeedbackPanel — comprehensive feedback for any beta project.
//
// Features:
//   • Submit to Supabase (cloud) + localStorage fallback
//   • Show community stats (average rating, total reviews)
//   • Show recent community reviews
//   • Sync cached submissions when online
//   • Migrate legacy localStorage data on first load
// ===========================================================

import { useState, useEffect, useCallback } from 'react';
import { Icon } from './Icon';
import { GlassPanel, NeonButton } from './ui';
import { cn } from '../lib/cn';
import type { BetaProject } from '../data/betaLabs';
import {
  submitFeedback,
  fetchProjectStats,
  fetchRecentReviews,
  syncCachedSubmissions,
  migrateLegacyData,
  getLocalFeedbackForProject,
  rowToSubmission,
  type FeedbackSubmission,
  type ProjectStats,
  type FeedbackRow,
} from '../lib/feedbackService';

// ── Types ────────────────────────────────────────────────────────

interface CategoryRatings {
  ui: number;
  learning: number;
  realism: number;
  easeOfUse: number;
  performance: number;
  fun: number;
}

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

// ── Component ────────────────────────────────────────────────────

interface FeedbackPanelProps {
  project: BetaProject;
  className?: string;
}

export function FeedbackPanel({ project, className }: FeedbackPanelProps) {
  // Form state
  const [overallRating, setOverallRating] = useState(0);
  const [ratingReason, setRatingReason] = useState('');
  const [categoryRatings, setCategoryRatings] = useState<CategoryRatings>({ ...DEFAULT_CATEGORIES });
  const [likedMost, setLikedMost] = useState('');
  const [improvements, setImprovements] = useState('');
  const [bugReport, setBugReport] = useState('');
  const [featureRequests, setFeatureRequests] = useState('');
  const [username, setUsername] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [cachedMode, setCachedMode] = useState(false);

  // Community data
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [communityReviews, setCommunityReviews] = useState<FeedbackRow[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Local feedback
  const [localFeedback, setLocalFeedback] = useState<FeedbackSubmission[]>([]);

  // Fetch community stats + reviews on mount
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoadingStats(true);

      // Migrate legacy data + sync cached on first load
      await migrateLegacyData();
      await syncCachedSubmissions();

      // Fetch community stats
      const projectStats = await fetchProjectStats(project.slug);
      if (mounted) {
        setStats(projectStats);
      }

      // Fetch recent community reviews
      const reviews = await fetchRecentReviews(project.slug, 5);
      if (mounted) {
        setCommunityReviews(reviews);
      }

      // Load local feedback
      const local = getLocalFeedbackForProject(project.slug);
      if (mounted) {
        setLocalFeedback(local.slice(0, 5));
      }

      setLoadingStats(false);
    };

    load();

    return () => { mounted = false; };
  }, [project.slug]);

  const canSubmit = overallRating > 0 && ratingReason.trim().length >= 20;

  const handleSubmit = useCallback(async () => {
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
      username: isAnonymous ? undefined : username.trim() || undefined,
      isAnonymous,
    };

    const result = await submitFeedback(submission);
    setCachedMode(result.cached);

    // Reset form
    setOverallRating(0);
    setRatingReason('');
    setCategoryRatings({ ...DEFAULT_CATEGORIES });
    setLikedMost('');
    setImprovements('');
    setBugReport('');
    setFeatureRequests('');
    setUsername('');
    setIsAnonymous(true);

    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);

    // Refresh community stats
    const projectStats = await fetchProjectStats(project.slug);
    setStats(projectStats);

    const reviews = await fetchRecentReviews(project.slug, 5);
    setCommunityReviews(reviews);

    // Update local feedback
    const local = getLocalFeedbackForProject(project.slug);
    setLocalFeedback(local.slice(0, 5));
  }, [canSubmit, project, overallRating, ratingReason, categoryRatings, likedMost, improvements, bugReport, featureRequests, username, isAnonymous]);

  const updateCategory = (key: keyof CategoryRatings, value: number) =>
    setCategoryRatings((prev) => ({ ...prev, [key]: value }));

  return (
    <div className={cn('space-y-6', className)}>
      {/* Community Stats */}
      {!loadingStats && stats && stats.totalReviews > 0 && (
        <GlassPanel className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                Community Rating
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-display text-2xl font-bold text-white">
                  {stats.averageRating.toFixed(1)}
                </span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Icon
                      key={s}
                      name="Star"
                      size={16}
                      className={s <= Math.round(stats.averageRating) ? 'fill-warn-400 text-warn-400' : 'text-slate-700'}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-2xl font-bold text-neon-400">{stats.totalReviews}</div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                {stats.totalReviews === 1 ? 'Review' : 'Reviews'}
              </div>
            </div>
          </div>

          {/* Rating distribution */}
          <div className="mt-4 space-y-1.5">
            {stats.ratingDistribution.map(({ rating, count }) => {
              const pct = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
              return (
                <div key={rating} className="flex items-center gap-2">
                  <span className="w-3 text-center text-xs text-slate-500">{rating}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-warn-400/60"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-6 text-right font-mono text-[10px] text-slate-600">{count}</span>
                </div>
              );
            })}
          </div>
        </GlassPanel>
      )}

      {/* Feedback Form Header */}
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

      {/* Username / Anonymous */}
      <FormBlock label="Your Name (optional)">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Anonymous"
            disabled={isAnonymous}
            className={cn(
              'flex-1 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-slate-200',
              'placeholder-slate-600 focus:border-neon-400/50 focus:outline-none',
              isAnonymous && 'opacity-50',
            )}
          />
          <label className="flex items-center gap-2 text-sm text-slate-400">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded border-white/20"
            />
            Anonymous
          </label>
        </div>
      </FormBlock>

      {/* Submit */}
      <div className="space-y-2">
        <NeonButton onClick={handleSubmit} disabled={!canSubmit || submitting} className="w-full justify-center">
          {submitting ? (
            <span className="flex items-center gap-2"><Icon name="Loader2" size={14} className="animate-spin" /> Submitting...</span>
          ) : submitted ? (
            <span className="flex items-center gap-2"><Icon name="Check" size={14} /> Submitted!</span>
          ) : (
            <span className="flex items-center gap-2"><Icon name="Send" size={14} /> Submit Feedback</span>
          )}
        </NeonButton>
        {cachedMode && submitted && (
          <p className="text-center text-xs text-warn-400">
            Saved locally — will sync when online.
          </p>
        )}
      </div>

      {/* Community Reviews */}
      {communityReviews.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-white/5">
          <h4 className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
            Community Reviews
          </h4>
          {communityReviews.map((review) => (
            <CommunityReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      {/* Recent Local Feedback (fallback) */}
      {localFeedback.length > 0 && communityReviews.length === 0 && (
        <div className="space-y-4 pt-4">
          <h4 className="font-mono text-[11px] uppercase tracking-wider text-slate-500">Recent Feedback</h4>
          {localFeedback.map((fb) => (
            <FeedbackCard key={fb.id} feedback={fb} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Primitives ──────────────────────────────────────────────────────

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

function CommunityReviewCard({ review }: { review: FeedbackRow }) {
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
                className={s <= review.overall_rating ? 'fill-warn-400 text-warn-400' : 'text-slate-700'} />
            ))}
          </div>
          <span className="font-mono text-[10px] text-slate-500">{timeAgo(review.created_at)}</span>
        </div>
        <div className="flex items-center gap-2">
          {!review.is_anonymous && review.username && (
            <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 font-mono text-[10px] text-cyan-300">
              {review.username}
            </span>
          )}
          {review.is_anonymous && (
            <span className="font-mono text-[10px] text-slate-600">Anonymous</span>
          )}
        </div>
      </div>

      <p className="mt-2 line-clamp-2 text-sm text-slate-300">{review.rating_reason}</p>

      <button onClick={() => setExpanded((e) => !e)}
        className="mt-2 font-mono text-[10px] text-cyan-400 hover:text-cyan-300">
        {expanded ? 'Show less' : 'Show more'}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3 border-t border-white/5 pt-3">
          <div className="grid grid-cols-2 gap-2">
            {(['ui', 'learning', 'realism', 'easeOfUse', 'performance', 'fun'] as const).map((key) => {
              const ratingKey = key === 'easeOfUse' ? 'ease_of_use_rating' : `${key}_rating` as keyof FeedbackRow;
              const rating = review[ratingKey] as number;
              return (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{CATEGORY_LABELS[key]}</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Icon key={s} name="Star" size={10}
                        className={s <= rating ? 'fill-warn-400 text-warn-400' : 'text-slate-700'} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          {review.liked_most && <ExpandedField label="Liked Most" value={review.liked_most} />}
          {review.improvements && <ExpandedField label="Improvements" value={review.improvements} />}
          {review.bug_report && <ExpandedField label="Bug Report" value={review.bug_report} accent="text-err-400" />}
          {review.feature_requests && <ExpandedField label="Feature Requests" value={review.feature_requests} accent="text-cyan-400" />}
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
