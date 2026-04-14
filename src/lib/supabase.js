import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const SUPABASE_URL = 'https://pfnlebwkbhblytpvaokd.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_O8CemBWuZAjQDC6gSkNq9Q_wAmDtHiv';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});