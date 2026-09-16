import { createClient } from '@supabase/supabase-js';

/**
 * Serverless connectivity probe — runs ON Vercel with real env values.
 * GET /api/admin/load-awards?action=probe with the loader token.
 * Diagnoses the "fetch failed" by isolating DNS vs auth vs table errors.
 */
export async function GET() {
  const token = process.env.LOADER_TOKEN;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const diag: Record<string, string> = {
    urlPresent: String(Boolean(url)),
    urlPrefix: url ? url.slice(0, 12) : 'MISSING',
    keyPresent: String(Boolean(key)),
    keyLen: String(key?.length ?? 0),
  };
  if (!url || !key) {
    return Response.json({ error: 'env missing', diag }, { status: 500 });
  }
  try {
    const sb = createClient(url, key, { auth: { persistSession: false } });
    const { count, error } = await sb
      .from('awards')
      .select('id', { count: 'exact', head: true });
    return Response.json({
      ok: !error,
      count: count ?? null,
      errCode: error?.code ?? null,
      errMsg: error?.message ?? null,
      diag,
    });
  } catch (e) {
    return Response.json(
      { error: 'probe threw', detail: String(e), diag },
      { status: 500 }
    );
  }
}
