import { Redis } from '@upstash/redis';

// Initialize Redis only if env vars are present (prevents crash in local dev without Upstash)
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

// Default cache TTL in seconds for standard responses (e.g., ticket queries)
export const CACHE_TTL = 45;

export const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

export async function fetchWithCache<T>(key: string, fetchFn: () => Promise<T>, ttl: number = CACHE_TTL): Promise<T> {
  if (!redis) {
    return await fetchFn();
  }

  try {
    const cached = await redis.get<T>(key);
    if (cached) {
      return cached;
    }
  } catch (error) {
    console.warn(`Redis Cache Miss/Error for key ${key}:`, error);
  }

  const data = await fetchFn();

  try {
    if (redis) {
      await redis.set(key, data, { ex: ttl });
    }
  } catch (error) {
    console.warn(`Redis Cache Set Error for key ${key}:`, error);
  }

  return data;
}

export async function invalidateCachePattern(pattern: string) {
  if (!redis) return;

  try {
    // Note: Upstash REST might have limited SCAN/KEYS depending on exact endpoint,
    // but in generic Redis implementations this works for low-cardinality keys.
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`Cache Invalidated: ${keys.length} keys matching ${pattern}`);
    }
  } catch (error) {
    console.warn(`Redis Cache Invalidation Error for pattern ${pattern}:`, error);
  }
}
