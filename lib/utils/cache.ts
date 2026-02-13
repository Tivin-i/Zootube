/**
 * Caching utilities for Voobi
 * Provides in-memory cache with TTL support
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<unknown>>();

  /**
   * Get a value from cache if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set a value in cache with TTL in seconds
   */
  set<T>(key: string, value: T, ttlSeconds: number): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data: value, expiresAt });
  }

  /**
   * Delete a value from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clean up expired entries (should be called periodically)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const cache = new SimpleCache();

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  YOUTUBE_METADATA: 24 * 60 * 60, // 24 hours
  VIDEO_LIST: 5 * 60, // 5 minutes
  PARENT_LOOKUP: 60, // 1 minute
} as const;

/**
 * Generate cache key for YouTube video metadata
 */
export function getYouTubeMetadataCacheKey(videoId: string): string {
  return `youtube:metadata:${videoId}`;
}

/**
 * Generate cache key for video list
 */
export function getVideoListCacheKey(householdId: string, page?: number, limit?: number): string {
  return `videos:list:${householdId}:${page || 1}:${limit || 'all'}`;
}
