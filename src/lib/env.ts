/**
 * Environment helpers. IRAssist runs in DEMO MODE (seeded data, no auth
 * enforcement) when Supabase isn't configured, so the whole UI is usable
 * without a live backend. Filling the Supabase env vars flips on real auth.
 */

export function hasValidSupabaseConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && /^https?:\/\//.test(url) && key.length > 20);
}

/** True when no real Supabase backend is wired — the app serves seeded data. */
export function isDemoMode(): boolean {
  return !hasValidSupabaseConfig();
}

export function checkSupabasePublicConfig(
  url?: string,
  key?: string
): { configured: boolean } {
  return { configured: Boolean(url && key && /^https?:\/\//.test(url) && key.length > 20) };
}

export function getSupabasePublicEnvSetupMessage(url?: string, key?: string): string {
  const missing: string[] = [];
  if (!url) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!key) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  return `Supabase is not configured. Set ${missing.join(' and ')} in .env.local. ` +
    `Until then, IRAssist runs in demo mode.`;
}

export function getEnvSetupMessage(): string {
  return (
    'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL, ' +
    'NEXT_PUBLIC_SUPABASE_ANON_KEY (and SUPABASE_SERVICE_ROLE_KEY for admin ops) ' +
    'in .env.local to enable authentication.'
  );
}

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'IR Assist';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
