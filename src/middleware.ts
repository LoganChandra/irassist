import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { enforceIpAllowlist } from '@/lib/security/ip';

export async function middleware(request: NextRequest) {
  // Network gate first — nothing (auth included) is reachable off-list.
  const blocked = enforceIpAllowlist(request);
  if (blocked) return blocked;

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image
     * - favicon.ico
     * - static image assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
