/*
# Create progress and notes tables (single-tenant, no auth) — retry

Fix: DROP POLICY does not accept a FOR clause. Re-running with corrected syntax.
This migration is idempotent (IF NOT EXISTS + DROP POLICY IF EXISTS).

1. New Tables
   - operator_progress (singleton, id=1): xp, completed_labs[], completed_volumes[],
     mission_progress jsonb, booted, updated_at
   - notes: id, title, body, updated_at, created_at
2. Security: RLS on both; 4 CRUD policies each, TO anon, authenticated, USING(true)/
   WITH CHECK(true) — data is intentionally public in this no-auth single-tenant app.
*/

CREATE TABLE IF NOT EXISTS operator_progress (
  id int PRIMARY KEY DEFAULT 1,
  xp int NOT NULL DEFAULT 0,
  completed_labs text[] NOT NULL DEFAULT '{}',
  completed_volumes text[] NOT NULL DEFAULT '{}',
  mission_progress jsonb NOT NULL DEFAULT '{}'::jsonb,
  booted boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT singleton_progress CHECK (id = 1)
);

ALTER TABLE operator_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_progress" ON operator_progress;
CREATE POLICY "anon_select_progress" ON operator_progress FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_progress" ON operator_progress;
CREATE POLICY "anon_insert_progress" ON operator_progress FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_progress" ON operator_progress;
CREATE POLICY "anon_update_progress" ON operator_progress FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_progress" ON operator_progress;
CREATE POLICY "anon_delete_progress" ON operator_progress FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_notes" ON notes;
CREATE POLICY "anon_select_notes" ON notes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_notes" ON notes;
CREATE POLICY "anon_insert_notes" ON notes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_notes" ON notes;
CREATE POLICY "anon_update_notes" ON notes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_notes" ON notes;
CREATE POLICY "anon_delete_notes" ON notes FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS notes_updated_at_idx ON notes (updated_at DESC);
