// ===========================================================
// FeedbackDashboardPage — developer analytics console.
//
// Features:
//   • Overview stats (total, average, reviews today/week/month)
//   • Per-project breakdown with category averages
//   • Full review list with search, filter, sort
//   • Rating distribution visualization
//   • Real-time data from Supabase
// ===========================================================

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from '../state/router';
import { GlassPanel, NeonButton, Chip, EmptyState } from '../components/ui';
import { Icon } from '../components/Icon';
import { cn } from '../lib/cn';
import {
  fetchDashboardOverview,
  fetchAllStats,
  fetchAllReviews,
  rowToSubmission,
  type FeedbackRow,
  type ProjectStats,
} from '../lib/feedbackService';

// ── Overview Card ───────────────────────────────────────────────────

function StatCard({
  label,
  value,
  unit,
  icon,
  accent,
}: {
  label: string;
  value: number | string;
  unit?: string;
  icon: string;
  accent?: 'neon' | 'cyan' | 'warn';
}) {
  const colorClass = accent === 'neon' ? 'text-neon-400' : accent === 'cyan' ? 'text-cyan-400' : accent === 'warn' ? 'text-warn-400' : 'text-white';
  return (
    <GlassPanel className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
          <div className={cn('mt-1 font-display text-2xl font-bold', colorClass)}>
            {value}{unit && <span className="text-base ml-0.5">{unit}</span>}
          </div>
        </div>
        <Icon name={icon} size={24} className={cn('opacity-40', colorClass)} />
      </div>
    </GlassPanel>
  );
}

// ── Rating Distribution Chart ───────────────────────────────────────

function RatingDistribution({ stats }: { stats: ProjectStats }) {
  const maxCount = Math.max(...stats.ratingDistribution.map((d) => d.count), 1);

  return (
    <div className="space-y-2">
      {stats.ratingDistribution.map(({ rating, count }) => {
        const pct = (count / maxCount) * 100;
        return (
          <div key={rating} className="flex items-center gap-3">
            <div className="flex w-12 items-center justify-end gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Icon
                  key={s}
                  name="Star"
                  size={10}
                  className={s <= rating ? 'fill-warn-400 text-warn-400' : 'text-slate-700'}
                />
              ))}
            </div>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-warn-400/60 to-warn-400"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-8 text-right font-mono text-[11px] text-slate-400">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Project Card ─────────────────────────────────────────────────────

function ProjectCard({
  stats,
  selected,
  onClick,
}: {
  stats: ProjectStats;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'qc-focus w-full rounded-xl border p-4 text-left transition-all',
        selected
          ? 'border-neon-400/40 bg-neon-400/10'
          : 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="truncate font-display text-base font-semibold text-white">
            {stats.projectTitle}
          </div>
          <div className="mt-1 font-mono text-[10px] text-slate-500">
            {stats.projectSlug}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="flex items-center gap-1">
            <Icon name="Star" size={14} className="fill-warn-400 text-warn-400" />
            <span className="font-display text-lg font-bold text-white">
              {stats.averageRating.toFixed(1)}
            </span>
          </div>
          <div className="font-mono text-[10px] text-slate-500">
            {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
          </div>
        </div>
      </div>

      {/* Category averages */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {Object.entries(stats.categoryAverages).map(([key, val]) => {
          const label = key === 'easeOfUse' ? 'Ease' : key.charAt(0).toUpperCase() + key.slice(1);
          const displayVal = val > 0 ? val.toFixed(1) : '—';
          return (
            <div key={key} className="text-center">
              <div className="font-mono text-[10px] uppercase text-slate-600">{label}</div>
              <div className={cn('font-mono text-xs', val > 0 ? 'text-cyan-400' : 'text-slate-700')}>
                {displayVal}
              </div>
            </div>
          );
        })}
      </div>
    </button>
  );
}

// ── Review List Item ─────────────────────────────────────────────────

function ReviewListItem({
  review,
  onClick,
}: {
  review: FeedbackRow;
  onClick: () => void;
}) {
  const timeAgo = (iso: string) => {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <button
      onClick={onClick}
      className="qc-focus w-full rounded-xl border border-white/5 bg-white/[0.02] p-4 text-left transition-all hover:border-white/10 hover:bg-white/[0.04]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((s) => (
              <Icon
                key={s}
                name="Star"
                size={12}
                className={s <= review.overall_rating ? 'fill-warn-400 text-warn-400' : 'text-slate-700'}
              />
            ))}
          </div>
          <span className="font-mono text-[10px] text-slate-500">
            {review.is_anonymous ? 'Anonymous' : review.username || 'Anonymous'}
          </span>
        </div>
        <span className="font-mono text-[10px] text-slate-600">
          {timeAgo(review.created_at)}
        </span>
      </div>
      <div className="mt-1 font-mono text-[10px] text-cyan-400">{review.project_title}</div>
      <p className="mt-2 line-clamp-2 text-sm text-slate-300">{review.rating_reason}</p>
    </button>
  );
}

// ── Review Detail Modal ──────────────────────────────────────────────

function ReviewDetailModal({
  review,
  onClose,
}: {
  review: FeedbackRow;
  onClose: () => void;
}) {
  const categoryLabels: Record<string, string> = {
    ui: 'UI Design',
    learning: 'Learning',
    realism: 'Realism',
    easeOfUse: 'Ease of Use',
    performance: 'Performance',
    fun: 'Fun',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <GlassPanel className="relative z-10 max-h-[80vh] w-full max-w-2xl overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Icon
                    key={s}
                    name="Star"
                    size={16}
                    className={s <= review.overall_rating ? 'fill-warn-400 text-warn-400' : 'text-slate-700'}
                  />
                ))}
              </div>
              <span className="font-display text-lg font-bold text-white">
                {review.overall_rating}.0
              </span>
            </div>
            <div className="mt-1 font-mono text-[11px] text-slate-500">
              {review.project_title} • {review.is_anonymous ? 'Anonymous' : review.username || 'Anonymous'}
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:text-white">
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Rating Reason */}
        <div className="mt-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500 mb-1">
            Why this rating
          </div>
          <p className="text-sm leading-relaxed text-slate-300">{review.rating_reason}</p>
        </div>

        {/* Category Ratings */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          {(['ui', 'learning', 'realism', 'easeOfUse', 'performance', 'fun'] as const).map((key) => {
            const ratingKey = key === 'easeOfUse' ? 'ease_of_use_rating' : `${key}_rating` as keyof FeedbackRow;
            const rating = review[ratingKey] as number;
            return (
              <div key={key} className="rounded-lg border border-white/5 bg-white/[0.02] p-2 text-center">
                <div className="font-mono text-[10px] uppercase text-slate-600">{categoryLabels[key]}</div>
                <div className="mt-1 flex justify-center">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Icon
                      key={s}
                      name="Star"
                      size={12}
                      className={s <= rating ? 'fill-warn-400 text-warn-400' : 'text-slate-700'}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional fields */}
        {review.liked_most && (
          <div className="mt-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-neon-400 mb-1">
              Liked Most
            </div>
            <p className="text-sm text-slate-400">{review.liked_most}</p>
          </div>
        )}
        {review.improvements && (
          <div className="mt-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-cyan-400 mb-1">
              Improvements
            </div>
            <p className="text-sm text-slate-400">{review.improvements}</p>
          </div>
        )}
        {review.bug_report && (
          <div className="mt-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-err-400 mb-1">
              Bug Report
            </div>
            <p className="text-sm text-slate-400">{review.bug_report}</p>
          </div>
        )}
        {review.feature_requests && (
          <div className="mt-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-violet-400 mb-1">
              Feature Requests
            </div>
            <p className="text-sm text-slate-400">{review.feature_requests}</p>
          </div>
        )}

        {/* Metadata */}
        <div className="mt-6 flex items-center gap-4 font-mono text-[10px] text-slate-600">
          <span>{new Date(review.created_at).toLocaleString()}</span>
          {review.version && <span>v{review.version}</span>}
        </div>
      </GlassPanel>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────

export function FeedbackDashboardPage() {
  const { navigate } = useRouter();

  // Overview stats
  const [overview, setOverview] = useState<{
    totalSubmissions: number;
    averageRating: number;
    totalProjects: number;
    reviewsToday: number;
    reviewsThisWeek: number;
    reviewsThisMonth: number;
  } | null>(null);

  // Project stats
  const [projectStats, setProjectStats] = useState<ProjectStats[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  // Reviews
  const [reviews, setReviews] = useState<FeedbackRow[]>([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [maxRating, setMaxRating] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [page, setPage] = useState(0);

  // Selected review for detail modal
  const [detailReview, setDetailReview] = useState<FeedbackRow | null>(null);

  const PAGE_SIZE = 20;

  // Load overview + project stats on mount
  useEffect(() => {
    const load = async () => {
      const [overviewData, allStats] = await Promise.all([
        fetchDashboardOverview(),
        fetchAllStats(),
      ]);
      setOverview(overviewData);
      setProjectStats(allStats);
    };
    load();
  }, []);

  // Load reviews when filters change
  useEffect(() => {
    const load = async () => {
      setLoadingReviews(true);
      const { reviews: data, total } = await fetchAllReviews({
        projectSlug: selectedProject || undefined,
        minRating,
        maxRating,
        search: search || undefined,
        sortBy,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      });
      setReviews(data);
      setTotalReviews(total);
      setLoadingReviews(false);
    };
    load();
  }, [selectedProject, minRating, maxRating, search, sortBy, page]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [selectedProject, minRating, maxRating, search, sortBy]);

  const totalPages = Math.ceil(totalReviews / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/dashboard')}
            className="qc-focus flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-slate-500 hover:text-neon-300"
          >
            <Icon name="ChevronRight" size={12} className="rotate-180" /> Dashboard
          </button>
          <h1 className="mt-2 font-display text-2xl font-bold text-white">Feedback Analytics</h1>
          <p className="text-sm text-slate-400">
            Community feedback and ratings for all beta simulators
          </p>
        </div>
        <Chip variant="neon">
          <Icon name="Lock" size={10} /> Admin
        </Chip>
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard
            label="Total Reviews"
            value={overview.totalSubmissions}
            icon="MessageSquare"
            accent="neon"
          />
          <StatCard
            label="Avg Rating"
            value={overview.averageRating.toFixed(1)}
            icon="Star"
            accent="warn"
          />
          <StatCard
            label="Projects"
            value={overview.totalProjects}
            icon="Folder"
          />
          <StatCard
            label="Today"
            value={overview.reviewsToday}
            icon="Calendar"
          />
          <StatCard
            label="This Week"
            value={overview.reviewsThisWeek}
            icon="Clock"
          />
          <StatCard
            label="This Month"
            value={overview.reviewsThisMonth}
            icon="TrendingUp"
          />
        </div>
      )}

      {/* Main Grid: Projects | Reviews */}
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Projects Sidebar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
              Projects
            </h2>
            {selectedProject && (
              <button
                onClick={() => setSelectedProject(null)}
                className="font-mono text-[10px] text-cyan-400 hover:text-cyan-300"
              >
                Clear filter
              </button>
            )}
          </div>

          {projectStats.length === 0 ? (
            <GlassPanel className="p-4 text-center">
              <Icon name="Inbox" size={24} className="mx-auto text-slate-600" />
              <p className="mt-2 text-sm text-slate-500">No feedback yet</p>
            </GlassPanel>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto no-scrollbar">
              {projectStats.map((stats) => (
                <ProjectCard
                  key={stats.projectSlug}
                  stats={stats}
                  selected={selectedProject === stats.projectSlug}
                  onClick={() => setSelectedProject(selectedProject === stats.projectSlug ? null : stats.projectSlug)}
                />
              ))}
            </div>
          )}

          {/* Selected project distribution */}
          {selectedProject && (
            <GlassPanel className="p-4">
              <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500 mb-3">
                Rating Distribution
              </div>
              <RatingDistribution stats={projectStats.find((p) => p.projectSlug === selectedProject)!} />
            </GlassPanel>
          )}
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {/* Filters */}
          <GlassPanel className="flex flex-wrap items-center gap-3 p-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search reviews..."
                  className="w-full rounded-lg border border-white/10 bg-white/[0.02] py-2 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-600 focus:border-neon-400/50 focus:outline-none"
                />
              </div>
            </div>

            {/* Rating filters */}
            <div className="flex items-center gap-2">
              <select
                value={minRating ?? ''}
                onChange={(e) => setMinRating(e.target.value ? Number(e.target.value) : undefined)}
                className="rounded-lg border border-white/10 bg-white/[0.02] px-2 py-1.5 text-sm text-slate-300 focus:border-neon-400/50 focus:outline-none"
              >
                <option value="">Min ★</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}+</option>
                ))}
              </select>
              <span className="text-slate-600">—</span>
              <select
                value={maxRating ?? ''}
                onChange={(e) => setMaxRating(e.target.value ? Number(e.target.value) : undefined)}
                className="rounded-lg border border-white/10 bg-white/[0.02] px-2 py-1.5 text-sm text-slate-300 focus:border-neon-400/50 focus:outline-none"
              >
                <option value="">Max ★</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-lg border border-white/10 bg-white/[0.02] px-2 py-1.5 text-sm text-slate-300 focus:border-neon-400/50 focus:outline-none"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="highest">Highest</option>
              <option value="lowest">Lowest</option>
            </select>
          </GlassPanel>

          {/* Reviews Grid */}
          {loadingReviews ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-400/30 border-t-neon-400" />
            </div>
          ) : reviews.length === 0 ? (
            <EmptyState
              icon={<Icon name="Inbox" size={32} />}
              title="No reviews found"
              description="Try adjusting your filters"
            />
          ) : (
            <>
              <div className="font-mono text-[10px] text-slate-500">
                Showing {reviews.length} of {totalReviews} reviews
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {reviews.map((review) => (
                  <ReviewListItem
                    key={review.id}
                    review={review}
                    onClick={() => setDetailReview(review)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <NeonButton
                    variant="ghost"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <Icon name="ChevronLeft" size={14} /> Prev
                  </NeonButton>
                  <span className="font-mono text-sm text-slate-500">
                    {page + 1} / {totalPages}
                  </span>
                  <NeonButton
                    variant="ghost"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next <Icon name="ChevronRight" size={14} />
                  </NeonButton>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {detailReview && (
        <ReviewDetailModal
          review={detailReview}
          onClose={() => setDetailReview(null)}
        />
      )}
    </div>
  );
}
