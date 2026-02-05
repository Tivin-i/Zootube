import { cache, getYouTubeMetadataCacheKey, getVideoListCacheKey, CACHE_TTL } from '@/lib/utils/cache'

describe('Cache Utilities', () => {
  beforeEach(() => {
    cache.clear()
  })

  describe('cache', () => {
    it('should store and retrieve values', () => {
      cache.set('test-key', 'test-value', 60)
      expect(cache.get('test-key')).toBe('test-value')
    })

    it('should return null for non-existent keys', () => {
      expect(cache.get('non-existent')).toBeNull()
    })

    it('should expire entries after TTL', async () => {
      cache.set('expiring-key', 'value', 0.1) // 100ms TTL
      expect(cache.get('expiring-key')).toBe('value')
      
      await new Promise(resolve => setTimeout(resolve, 150))
      expect(cache.get('expiring-key')).toBeNull()
    })

    it('should delete entries', () => {
      cache.set('delete-key', 'value', 60)
      expect(cache.get('delete-key')).toBe('value')
      
      cache.delete('delete-key')
      expect(cache.get('delete-key')).toBeNull()
    })

    it('should clear all entries', () => {
      cache.set('key1', 'value1', 60)
      cache.set('key2', 'value2', 60)
      
      cache.clear()
      expect(cache.get('key1')).toBeNull()
      expect(cache.get('key2')).toBeNull()
    })

    it('should handle different data types', () => {
      cache.set('string', 'test', 60)
      cache.set('number', 42, 60)
      cache.set('object', { key: 'value' }, 60)
      cache.set('array', [1, 2, 3], 60)
      
      expect(cache.get('string')).toBe('test')
      expect(cache.get('number')).toBe(42)
      expect(cache.get('object')).toEqual({ key: 'value' })
      expect(cache.get('array')).toEqual([1, 2, 3])
    })
  })

  describe('getYouTubeMetadataCacheKey', () => {
    it('should generate correct cache key for YouTube metadata', () => {
      expect(getYouTubeMetadataCacheKey('abc123')).toBe('youtube:metadata:abc123')
      expect(getYouTubeMetadataCacheKey('dQw4w9WgXcQ')).toBe('youtube:metadata:dQw4w9WgXcQ')
    })
  })

  describe('getVideoListCacheKey', () => {
    it('should generate correct cache key for video list', () => {
      expect(getVideoListCacheKey('parent-id-123')).toBe('videos:list:parent-id-123:1:all')
      expect(getVideoListCacheKey('parent-id-123', 2)).toBe('videos:list:parent-id-123:2:all')
      expect(getVideoListCacheKey('parent-id-123', 2, 20)).toBe('videos:list:parent-id-123:2:20')
    })
  })

  describe('CACHE_TTL constants', () => {
    it('should have correct TTL values', () => {
      expect(CACHE_TTL.YOUTUBE_METADATA).toBe(24 * 60 * 60) // 24 hours
      expect(CACHE_TTL.VIDEO_LIST).toBe(5 * 60) // 5 minutes
      expect(CACHE_TTL.PARENT_LOOKUP).toBe(60) // 1 minute
    })
  })
})
