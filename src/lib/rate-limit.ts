// MVP implementation: in-memory counters reset on cold starts/redeploys.
// Use Redis/KV for distributed production rate limiting.
const bucket = new Map<string, number[]>();

export function isRateLimited(key: string, limit = 30, windowMs = 60_000): boolean {
  const now = Date.now();
  const requests = bucket.get(key)?.filter((timestamp) => now - timestamp < windowMs) ?? [];

  if (requests.length >= limit) {
    bucket.set(key, requests);
    return true;
  }

  requests.push(now);
  bucket.set(key, requests);
  return false;
}
