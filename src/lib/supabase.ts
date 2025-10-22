// Lightweight supabase client wrapper. If VITE_SUPABASE_URL/KEY are not configured,
// this module exports `supabase` as null and `isSupabaseEnabled()` false so callers can fail gracefully.

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let supabase: SupabaseClient | null = null;

if (url && anonKey) {
  supabase = createClient(url, anonKey);
}

export function isSupabaseEnabled() {
  return supabase !== null;
}

export default supabase;
