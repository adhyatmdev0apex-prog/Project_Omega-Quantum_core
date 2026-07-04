/*
# Create beta_feedback table

1. Purpose
   - Cloud-backed storage for all beta project feedback submissions
   - Replaces localStorage-only approach with Supabase as primary storage
   - Enables community ratings, reviews, and developer analytics

2. New Tables
   - `beta_feedback`
     - `id` (uuid, primary key)
     - `project_slug` (text, indexed) — identifies which simulator
     - `project_title` (text) — denormalized for display
     - `overall_rating` (int, 1-5) — required rating
     - `ui_rating` (int, 0-5, optional) — category rating
     - `learning_rating` (int, 0-5, optional) — category rating
     - `realism_rating` (int, 0-5, optional) — category rating
     - `ease_of_use_rating` (int, 0-5, optional) — category rating
     - `performance_rating` (int, 0-5, optional) — category rating
     - `fun_rating` (int, 0-5, optional) — category rating
     - `rating_reason` (text, required) — why this rating
     - `liked_most` (text, optional) — positive feedback
     - `improvements` (text, optional) — suggested improvements
     - `bug_report` (text, optional) — bug reports
     - `feature_requests` (text, optional) — feature ideas
     - `username` (text, optional) — display name
     - `is_anonymous` (boolean, default true) — privacy flag
     - `version` (text, optional) — simulator version
     - `created_at` (timestamptz, indexed)
     - `updated_at` (timestamptz)

3. Security
   - Enable RLS on `beta_feedback`
   - Public read: anyone can view all feedback (community feature)
   - Public write: anyone can submit feedback (no auth required)
   - No owner-scoping: feedback is intentionally shared/public

4. Indexes
   - `idx_beta_feedback_project_slug` — filter by project
   - `idx_beta_feedback_created_at` — sort by recency
   - `idx_beta_feedback_overall_rating` — sort/filter by rating
*/

CREATE TABLE IF NOT EXISTS beta_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_slug text NOT NULL,
  project_title text NOT NULL,
  overall_rating int NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  ui_rating int DEFAULT 0 CHECK (ui_rating >= 0 AND ui_rating <= 5),
  learning_rating int DEFAULT 0 CHECK (learning_rating >= 0 AND learning_rating <= 5),
  realism_rating int DEFAULT 0 CHECK (realism_rating >= 0 AND realism_rating <= 5),
  ease_of_use_rating int DEFAULT 0 CHECK (ease_of_use_rating >= 0 AND ease_of_use_rating <= 5),
  performance_rating int DEFAULT 0 CHECK (performance_rating >= 0 AND performance_rating <= 5),
  fun_rating int DEFAULT 0 CHECK (fun_rating >= 0 AND fun_rating <= 5),
  rating_reason text NOT NULL,
  liked_most text DEFAULT '',
  improvements text DEFAULT '',
  bug_report text DEFAULT '',
  feature_requests text DEFAULT '',
  username text DEFAULT '',
  is_anonymous boolean DEFAULT true,
  version text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE beta_feedback ENABLE ROW LEVEL SECURITY;

-- Public read: anyone can view all feedback
DROP POLICY IF EXISTS "public_read_feedback" ON beta_feedback;
CREATE POLICY "public_read_feedback"
ON beta_feedback FOR SELECT
TO anon, authenticated
USING (true);

-- Public insert: anyone can submit feedback
DROP POLICY IF EXISTS "public_insert_feedback" ON beta_feedback;
CREATE POLICY "public_insert_feedback"
ON beta_feedback FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- No update/delete from public: submissions are immutable
-- (Developer can manage via Supabase dashboard if needed)

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_beta_feedback_project_slug ON beta_feedback(project_slug);
CREATE INDEX IF NOT EXISTS idx_beta_feedback_created_at ON beta_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_beta_feedback_overall_rating ON beta_feedback(overall_rating);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_beta_feedback_updated_at ON beta_feedback;
CREATE TRIGGER update_beta_feedback_updated_at
  BEFORE UPDATE ON beta_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();