/**
 * In-memory rate limiter.
 *
 * Uses a sliding-window counter per key.
 * In production, replace with a distributed store (e.g. @upstash/ratelimit + Redis)
 * so limits apply across all Lambda/container instances.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Exported for testing / cleanup
export const _store = new Map<string, RateLimitEntry>();

export interface RateLimiter {
  limit(key: string): { success: boolean; remaining: number; retryAfter: number };
}

export function createRateLimiter(maxRequests: number, windowMs: number): RateLimiter {
  return {
    limit(key: string) {
      const now = Date.now();
      const entry = _store.get(key);

      if (!entry || now >= entry.resetAt) {
        _store.set(key, { count: 1, resetAt: now + windowMs });
        return { success: true, remaining: maxRequests - 1, retryAfter: 0 };
      }

      if (entry.count >= maxRequests) {
        return {
          success: false,
          remaining: 0,
          retryAfter: Math.ceil((entry.resetAt - now) / 1000),
        };
      }

      entry.count++;
      return {
        success: true,
        remaining: maxRequests - entry.count,
        retryAfter: 0,
      };
    },
  };
}

// Pre-configured limiters per endpoint
export const rateLimiters = {
  /** POST /api/users — 10 registrations per minute per IP */
  createUser: createRateLimiter(10, 60_000),
  /** GET /api/users — 30 requests per minute per IP */
  listUsers: createRateLimiter(30, 60_000),
  /** POST /api/transactions — 20 requests per minute per user */
  createTransaction: createRateLimiter(20, 60_000),
  /** GET /api/transactions — 30 requests per minute per user */
  listTransactions: createRateLimiter(30, 60_000),
};
