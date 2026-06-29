import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ===========================================================
// Supabase client singleton. Single-tenant, no auth.
// Env vars are pre-populated by the host environment.
// ===========================================================

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export const hasSupabase = Boolean(supabase);
