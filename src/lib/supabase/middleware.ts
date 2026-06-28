import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { hasValidSupabaseConfig } from '@/lib/env';

type CookieToSet = { name: string; value: string; options: CookieOptions };

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/cases',
  '/disciplinary',
  '/investigation',
  '/pip',
  '/templates',
  '/assistant',
  '/awards',
  '/reports',
  '/tools',
  '/settings',
];

const AUTH_PAGES = ['/login', '/signup', '/forgot-password', '/reset-password'];

/**
 * Refreshes the user's auth session and gates protected routes.
 * In DEMO MODE (no Supabase configured) it passes everything through so the
 * full workspace stays browsable with seeded data.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Demo mode → no auth enforcement.
  if (!hasValidSupabaseConfig()) {
    return response;
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: CookieToSet[]) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const path = request.nextUrl.pathname;
    const isProtected = PROTECTED_PREFIXES.some((p) => path.startsWith(p));
    const isAuthPage = AUTH_PAGES.includes(path);

    if (!user && isProtected) {
      const dest = request.nextUrl.pathname + request.nextUrl.search;
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.search = '';
      url.searchParams.set('next', dest);
      return NextResponse.redirect(url);
    }

    if (user && isAuthPage && path !== '/reset-password') {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  } catch (error) {
    // Never 500 the whole site on a Supabase hiccup — log and pass through.
    console.error('[middleware] Supabase session refresh failed:', error);
  }

  return response;
}
