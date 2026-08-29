const buckets = new Map();
const MAX_BUCKETS = 10000;

function clientKey(req) {
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function prune(now) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  if (buckets.size >= MAX_BUCKETS) {
    for (const key of buckets.keys()) {
      buckets.delete(key);
      if (buckets.size < MAX_BUCKETS * 0.8) break;
    }
  }
}

export function rateLimit({ windowMs, max, scope = 'global' }) {
  return (req, res, next) => {
    const now = Date.now();
    if (buckets.size >= MAX_BUCKETS) prune(now);
    const key = `${scope}:${clientKey(req)}`;
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    const remaining = Math.max(0, max - bucket.count);
    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(remaining));
    res.setHeader('RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));
    if (bucket.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
      return res.status(429).json({ error: 'Zbyt wiele żądań. Spróbuj ponownie później.' });
    }
    next();
  };
}
