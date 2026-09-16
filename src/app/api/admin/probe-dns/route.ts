import { NextResponse, type NextRequest } from 'next/server';

/**
 * DNS probe: resolve the configured Supabase host from inside Vercel.
 * GET /api/admin/probe-dns with the loader token.
 */
export async function GET(_req: NextRequest) {
  const token = process.env.LOADER_TOKEN;
  if (!token || _req.headers.get('x-loader-token') !== token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const host = url.replace(/^https?:\/\//, '').split('/')[0] || 'NONE';
  const dns = await import('node:dns/promises');
  const result: Record<string, string> = { host };
  try {
    const addrs = await dns.resolve4(host);
    result.resolved = addrs.join(',');
  } catch (e) {
    result.dnsError = String(e);
  }
  try {
    const res = await fetch(url + '/rest/v1/', { method: 'HEAD' });
    result.restStatus = String(res.status);
  } catch (e) {
    result.fetchError = String(e);
  }
  return NextResponse.json(result);
}
