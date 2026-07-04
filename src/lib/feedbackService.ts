// ===========================================================
// FeedbackService — cloud-backed feedback with localStorage sync.
//
// Primary storage: Supabase beta_feedback table.
// Local cache: localStorage for offline support and migration.
//
// Features:
//   • Submit to Supabase (falls back to localStorage if offline)
//   • Sync cached submissions when back online
//   • Fetch community stats (averages, counts)
//   • Fetch recent public reviews
//   • Migrate legacy localStorage data to Supabase
// ===========================================================

import { supabase } from './supabase';

// ── Types ────────────────────────────────────────────────────────

export interface FeedbackRow {
  id: string;
  project_slug: string;
  project_title: string;
  overall_rating: number;
  ui_rating: number;
  learning_rating: number;
  realism_rating: number;
  ease_of_use_rating: number;
  performance_rating: number;
  fun_rating: number;
  rating_reason: string;
  liked_most: string;
  improvements: string;
  bug_report: string;
  feature_requests: string;
  username: string;
  is_anonymous: boolean;
  version: string;
  created_at: string;
  updated_at: string;
}

export interface FeedbackSubmission {
  id: string;
  timestamp: string;
  projectSlug: string;
  projectTitle: string;
  version: string;
  overallRating: number;
  ratingReason: string;
  categoryRatings: {
    ui: number;
    learning: number;
    realism: number;
    easeOfUse: number;
    performance: number;
    fun: number;
  };
  likedMost: string;
  improvements: string;
  bugReport: string;
  featureRequests: string;
  username?: string;
  isAnonymous: boolean;
}

export interface CommunityStats {
  totalReviews: number;
  averageRating: number;
  categoryAverages: {
    ui: number;
    learning: number;
    realism: number;
    easeOfUse: number;
    performance: number;
    fun: number;
  };
  ratingDistribution: { rating: number; count: number }[];
}

export interface ProjectStats extends CommunityStats {
  projectSlug: string;
  projectTitle: string;
}

// ── Constants ─────────────────────────────────────────────────────

const STORAGE_KEY = 'quantum-core.beta-feedback-v2';
const SYNC_QUEUE_KEY = 'quantum-core.beta-feedback-sync-queue';
const MIGRATED_KEY = 'quantum-core.beta-feedback-migrated';

// ── Submission ────────────────────────────────────────────────────

/**
 * Submit feedback to Supabase. Falls back to localStorage if offline.
 * Returns true if submitted to cloud, false if cached locally.
 */
export async function submitFeedback(submission: FeedbackSubmission): Promise<{ success: boolean; cached: boolean }> {
  const row = toRow(submission);

  try {
    const { error } = await supabase.from('beta_feedback').insert(row);
    if (error) throw error;

    // Also cache locally for immediate display
    cacheLocally(submission);
    return { success: true, cached: false };
  } catch (err) {
    console.warn('[FeedbackService] Supabase submit failed, caching locally:', err);
    cacheLocally(submission);
    queueForSync(submission);
    return { success: true, cached: true };
  }
}

/**
 * Sync all cached submissions to Supabase.
 * Call this when the app starts or when coming back online.
 */
export async function syncCachedSubmissions(): Promise<number> {
  const queue = getSyncQueue();
  if (queue.length === 0) return 0;

  const synced: string[] = [];
  const failed: FeedbackSubmission[] = [];

  for (const submission of queue) {
    const row = toRow(submission);
    try {
      const { error } = await supabase.from('beta_feedback').insert(row);
      if (error) throw error;
      synced.push(submission.id);
    } catch {
      failed.push(submission);
    }
  }

  // Update queue with only failed submissions
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(failed));

  // Remove synced items from local cache
  if (synced.length > 0) {
    const stored = getLocalCache();
    const remaining = stored.filter((s) => !synced.includes(s.id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
  }

  return synced.length;
}

/**
 * Migrate legacy localStorage feedback to Supabase.
 * Call once on first load after the new system is deployed.
 */
export async function migrateLegacyData(): Promise<number> {
  const migrated = localStorage.getItem(MIGRATED_KEY);
  if (migrated) return 0;

  const stored = getLocalCache();
  if (stored.length === 0) {
    localStorage.setItem(MIGRATED_KEY, 'true');
    return 0;
  }

  let count = 0;
  for (const submission of stored) {
    const row = toRow(submission);
    try {
      const { error } = await supabase.from('beta_feedback').insert(row);
      if (error) throw error;
      count++;
    } catch (err) {
      console.warn('[FeedbackService] Migration failed for', submission.id, err);
    }
  }

  localStorage.setItem(MIGRATED_KEY, 'true');
  return count;
}

// ── Fetching ──────────────────────────────────────────────────────

/**
 * Fetch community stats for a specific project.
 */
export async function fetchProjectStats(projectSlug: string): Promise<ProjectStats | null> {
  try {
    const { data, error } = await supabase
      .from('beta_feedback')
      .select('overall_rating, ui_rating, learning_rating, realism_rating, ease_of_use_rating, performance_rating, fun_rating, project_title')
      .eq('project_slug', projectSlug);

    if (error) throw error;
    if (!data || data.length === 0) return null;

    return computeProjectStats(projectSlug, data);
  } catch (err) {
    console.warn('[FeedbackService] Failed to fetch project stats:', err);
    return null;
  }
}

/**
 * Fetch community stats for all projects.
 */
export async function fetchAllStats(): Promise<ProjectStats[]> {
  try {
    const { data, error } = await supabase
      .from('beta_feedback')
      .select('project_slug, project_title, overall_rating, ui_rating, learning_rating, realism_rating, ease_of_use_rating, performance_rating, fun_rating');

    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Group by project
    const byProject = new Map<string, typeof data>();
    for (const row of data) {
      const existing = byProject.get(row.project_slug) || [];
      existing.push(row);
      byProject.set(row.project_slug, existing);
    }

    const stats: ProjectStats[] = [];
    for (const [slug, rows] of byProject) {
      stats.push(computeProjectStats(slug, rows));
    }

    return stats.sort((a, b) => b.totalReviews - a.totalReviews);
  } catch (err) {
    console.warn('[FeedbackService] Failed to fetch all stats:', err);
    return [];
  }
}

/**
 * Fetch recent public reviews for a project.
 */
export async function fetchRecentReviews(
  projectSlug: string,
  limit = 10,
): Promise<FeedbackRow[]> {
  try {
    const { data, error } = await supabase
      .from('beta_feedback')
      .select('*')
      .eq('project_slug', projectSlug)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('[FeedbackService] Failed to fetch recent reviews:', err);
    return [];
  }
}

/**
 * Fetch all reviews (for admin dashboard).
 */
export async function fetchAllReviews(
  options: {
    projectSlug?: string;
    minRating?: number;
    maxRating?: number;
    search?: string;
    sortBy?: 'newest' | 'oldest' | 'highest' | 'lowest';
    limit?: number;
    offset?: number;
  } = {},
): Promise<{ reviews: FeedbackRow[]; total: number }> {
  try {
    let query = supabase.from('beta_feedback').select('*', { count: 'exact' });

    if (options.projectSlug) {
      query = query.eq('project_slug', options.projectSlug);
    }
    if (options.minRating !== undefined) {
      query = query.gte('overall_rating', options.minRating);
    }
    if (options.maxRating !== undefined) {
      query = query.lte('overall_rating', options.maxRating);
    }
    if (options.search) {
      query = query.or(`rating_reason.ilike.%${options.search}%,username.ilike.%${options.search}%,liked_most.ilike.%${options.search}%,improvements.ilike.%${options.search}%`);
    }

    // Sorting
    const sortCol = options.sortBy === 'oldest' ? 'created_at'
      : options.sortBy === 'highest' ? 'overall_rating'
      : options.sortBy === 'lowest' ? 'overall_rating'
      : 'created_at';
    const ascending = options.sortBy === 'oldest' || options.sortBy === 'lowest';
    query = query.order(sortCol, { ascending });

    // Pagination
    const limit = options.limit || 50;
    const offset = options.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return { reviews: data || [], total: count || 0 };
  } catch (err) {
    console.warn('[FeedbackService] Failed to fetch all reviews:', err);
    return { reviews: [], total: 0 };
  }
}

/**
 * Fetch dashboard overview stats.
 */
export async function fetchDashboardOverview(): Promise<{
  totalSubmissions: number;
  averageRating: number;
  totalProjects: number;
  reviewsToday: number;
  reviewsThisWeek: number;
  reviewsThisMonth: number;
}> {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('beta_feedback')
      .select('overall_rating, project_slug, created_at');

    if (error) throw error;
    if (!data || data.length === 0) {
      return { totalSubmissions: 0, averageRating: 0, totalProjects: 0, reviewsToday: 0, reviewsThisWeek: 0, reviewsThisMonth: 0 };
    }

    const totalSubmissions = data.length;
    const averageRating = data.reduce((sum, r) => sum + r.overall_rating, 0) / totalSubmissions;
    const projects = new Set(data.map((r) => r.project_slug));
    const reviewsToday = data.filter((r) => r.created_at >= today).length;
    const reviewsThisWeek = data.filter((r) => r.created_at >= weekAgo).length;
    const reviewsThisMonth = data.filter((r) => r.created_at >= monthAgo).length;

    return {
      totalSubmissions,
      averageRating,
      totalProjects: projects.size,
      reviewsToday,
      reviewsThisWeek,
      reviewsThisMonth,
    };
  } catch (err) {
    console.warn('[FeedbackService] Failed to fetch dashboard overview:', err);
    return { totalSubmissions: 0, averageRating: 0, totalProjects: 0, reviewsToday: 0, reviewsThisWeek: 0, reviewsThisMonth: 0 };
  }
}

// ── Local Cache ────────────────────────────────────────────────────

export function getLocalCache(): FeedbackSubmission[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function getLocalFeedbackForProject(projectSlug: string): FeedbackSubmission[] {
  return getLocalCache().filter((s) => s.projectSlug === projectSlug);
}

function cacheLocally(submission: FeedbackSubmission): void {
  const stored = getLocalCache();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([submission, ...stored].slice(0, 100)));
}

function queueForSync(submission: FeedbackSubmission): void {
  try {
    const queue = getSyncQueue();
    queue.push(submission);
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Ignore
  }
}

function getSyncQueue(): FeedbackSubmission[] {
  try {
    const stored = localStorage.getItem(SYNC_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// ── Helpers ────────────────────────────────────────────────────────

function toRow(sub: FeedbackSubmission): Omit<FeedbackRow, 'created_at' | 'updated_at'> {
  return {
    id: sub.id,
    project_slug: sub.projectSlug,
    project_title: sub.projectTitle,
    overall_rating: sub.overallRating,
    ui_rating: sub.categoryRatings.ui,
    learning_rating: sub.categoryRatings.learning,
    realism_rating: sub.categoryRatings.realism,
    ease_of_use_rating: sub.categoryRatings.easeOfUse,
    performance_rating: sub.categoryRatings.performance,
    fun_rating: sub.categoryRatings.fun,
    rating_reason: sub.ratingReason,
    liked_most: sub.likedMost,
    improvements: sub.improvements,
    bug_report: sub.bugReport,
    feature_requests: sub.featureRequests,
    username: sub.username || '',
    is_anonymous: sub.isAnonymous,
    version: sub.version,
  };
}

export function rowToSubmission(row: FeedbackRow): FeedbackSubmission {
  return {
    id: row.id,
    timestamp: row.created_at,
    projectSlug: row.project_slug,
    projectTitle: row.project_title,
    version: row.version,
    overallRating: row.overall_rating,
    ratingReason: row.rating_reason,
    categoryRatings: {
      ui: row.ui_rating,
      learning: row.learning_rating,
      realism: row.realism_rating,
      easeOfUse: row.ease_of_use_rating,
      performance: row.performance_rating,
      fun: row.fun_rating,
    },
    likedMost: row.liked_most,
    improvements: row.improvements,
    bugReport: row.bug_report,
    featureRequests: row.feature_requests,
    username: row.username || undefined,
    isAnonymous: row.is_anonymous,
  };
}

function computeProjectStats(projectSlug: string, rows: Array<{
  overall_rating: number;
  ui_rating: number;
  learning_rating: number;
  realism_rating: number;
  ease_of_use_rating: number;
  performance_rating: number;
  fun_rating: number;
  project_title?: string;
}>): ProjectStats {
  const totalReviews = rows.length;
  const averageRating = rows.reduce((s, r) => s + r.overall_rating, 0) / totalReviews;

  // Category averages (only count non-zero ratings)
  const avgCategory = (key: 'ui_rating' | 'learning_rating' | 'realism_rating' | 'ease_of_use_rating' | 'performance_rating' | 'fun_rating') => {
    const rated = rows.filter((r) => r[key] > 0);
    return rated.length > 0 ? rated.reduce((s, r) => s + r[key], 0) / rated.length : 0;
  };

  // Rating distribution
  const distribution: { rating: number; count: number }[] = [];
  for (let i = 5; i >= 1; i--) {
    distribution.push({ rating: i, count: rows.filter((r) => r.overall_rating === i).length });
  }

  return {
    projectSlug,
    projectTitle: rows[0]?.project_title || projectSlug,
    totalReviews,
    averageRating,
    categoryAverages: {
      ui: avgCategory('ui_rating'),
      learning: avgCategory('learning_rating'),
      realism: avgCategory('realism_rating'),
      easeOfUse: avgCategory('ease_of_use_rating'),
      performance: avgCategory('performance_rating'),
      fun: avgCategory('fun_rating'),
    },
    ratingDistribution: distribution,
  };
}
