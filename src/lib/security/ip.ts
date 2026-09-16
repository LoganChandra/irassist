import { NextResponse, type NextRequest } from 'next/server';

/**
 * Edge IP allowlist.
 *
 * When IP_ALLOWLIST is set (comma-separated IPs and/or CIDR ranges), every
 * request whose client IP is not on the list gets a 403 — the whole site is
 * network-gated. When it is unset (local dev / demo mode) the gate is open.
 *
 * On Vercel, `x-real-ip` and `x-forwarded-for` are set by the edge and cannot
 * be spoofed by clients, so header-based IP resolution is safe here.
 *
 * Loopback is always allowed so local development and health checks work.
 */

const ALWAYS_ALLOWED = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

function parseAllowlist(): string[] {
  const raw = process.env.IP_ALLOWLIST ?? '';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Convert an IPv4 or IPv6 address into a flat bit array. Returns null on garbage. */
export function ipToBits(ip: string): number[] | null {
  const v = ip.trim().toLowerCase();
  if (v.includes(':')) {
    // IPv6 — expand "::" shorthand to 8 hex groups.
    let head: string[];
    let tail: string[];
    if (v.includes('::')) {
      const [l, r] = v.split('::');
      if (v.split('::').length > 2) return null; // more than one "::" is invalid
      head = l ? l.split(':') : [];
      tail = r ? r.split(':') : [];
    } else {
      head = v.split(':');
      tail = [];
    }
    const missing = 8 - head.length - tail.length;
    if (missing < 0) return null;
    const groups = [...head, ...Array<string>(missing).fill('0'), ...tail];
    if (groups.length !== 8) return null;
    const bits: number[] = [];
    for (const g of groups) {
      if (g.length === 0 || g.length > 4) return null;
      const n = parseInt(g, 16);
      if (Number.isNaN(n)) return null;
      for (let i = 15; i >= 0; i--) bits.push((n >> i) & 1);
    }
    return bits;
  }
  if (v.includes('.')) {
    const parts = v.split('.');
    if (parts.length !== 4) return null;
    const bits: number[] = [];
    for (const p of parts) {
      const n = Number(p);
      if (!Number.isInteger(n) || n < 0 || n > 255) return null;
      for (let i = 7; i >= 0; i--) bits.push((n >> i) & 1);
    }
    return bits;
  }
  return null;
}

/** True if `ip` equals `rule` or falls inside its CIDR prefix. */
export function matchesRule(ip: string, rule: string): boolean {
  if (rule === ip) return true;
  if (!rule.includes('/')) return false;
  const slash = rule.lastIndexOf('/');
  const base = rule.slice(0, slash);
  const prefix = Number(rule.slice(slash + 1));
  if (!Number.isInteger(prefix) || prefix < 0) return false;
  const ipBits = ipToBits(ip);
  const baseBits = ipToBits(base);
  if (!ipBits || !baseBits || ipBits.length !== baseBits.length) return false;
  if (prefix > ipBits.length) return false;
  for (let i = 0; i < prefix; i++) {
    if (ipBits[i] !== baseBits[i]) return false;
  }
  return true;
}

function clientIp(request: NextRequest): string {
  return (
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    ''
  );
}

/**
 * Returns a 403 response if the request must be blocked, or null to continue.
 * Fails closed: if an allowlist is configured but the client IP cannot be
 * determined, the request is rejected.
 */
export function enforceIpAllowlist(request: NextRequest): NextResponse | null {
  const allowlist = parseAllowlist();
  if (allowlist.length === 0) return null; // not configured → gate off

  const ip = clientIp(request);
  if (ALWAYS_ALLOWED.has(ip)) return null;
  if (!ip) {
    return new NextResponse('Forbidden', { status: 403 });
  }
  const allowed = allowlist.some((rule) => matchesRule(ip, rule));
  if (allowed) return null;
  return new NextResponse('Forbidden — access is restricted to approved networks.', {
    status: 403,
  });
}
