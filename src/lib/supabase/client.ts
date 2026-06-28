'use client';

import { createBrowserClient } from '@supabase/ssr';
import { checkSupabasePublicConfig, getSupabasePublicEnvSetupMessage } from '@/lib/env';

/**
 * Supabase client for Client Components. Uses the anon key — RLS enforces access.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!checkSupabasePublicConfig(url, key).configured) {
    throw new Error(getSupabasePublicEnvSetupMessage(url, key));
  }

  return createBrowserClient(url!, key!);
}
