const map = new Map<string, { count: number; reset: number }>();

export function getClientIp(req: { headers: { get(name: string): string | null } }) {
  return req.headers.get('x-forwarded-for') ?? 'unknown';
}

export function checkRateLimit(key: string, opts = { limit: 60, windowMs: 60000 }) {
  const now = Date.now();
  const e = map.get(key);
  if (!e || now > e.reset) { map.set(key, { count: 1, reset: now + opts.windowMs }); return { allowed: true, remaining: opts.limit - 1 }; }
  if (e.count >= opts.limit) return { allowed: false, remaining: 0 };
  e.count++;
  return { allowed: true, remaining: opts.limit - e.count };
}
