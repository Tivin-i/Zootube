import { formatDuration, formatDurationFromISO } from '@/lib/utils/duration'

describe('Duration Utilities', () => {
  describe('formatDuration', () => {
    it('should format seconds correctly', () => {
      expect(formatDuration(0)).toBe('0:00')
      expect(formatDuration(30)).toBe('0:30')
      expect(formatDuration(60)).toBe('1:00')
      expect(formatDuration(90)).toBe('1:30')
      expect(formatDuration(3661)).toBe('61:01') // 3661 seconds = 61 minutes 1 second
      expect(formatDuration(3600)).toBe('60:00') // 3600 seconds = 60 minutes
    })

    it('should handle null values', () => {
      expect(formatDuration(null)).toBe('0:00')
    })

    it('should handle very large numbers', () => {
      expect(formatDuration(999999)).toBe('16666:39') // 999999 seconds = 16666 minutes 39 seconds
    })
  })

  describe('formatDurationFromISO', () => {
    it('should parse ISO 8601 duration strings', () => {
      expect(formatDurationFromISO('PT30S')).toBe('0:30')
      expect(formatDurationFromISO('PT1M30S')).toBe('1:30')
      expect(formatDurationFromISO('PT1H')).toBe('1:00:00')
      expect(formatDurationFromISO('PT1H2M3S')).toBe('1:02:03')
      expect(formatDurationFromISO('PT0S')).toBe('0:00')
    })

    it('should handle invalid ISO strings gracefully', () => {
      expect(formatDurationFromISO('invalid')).toBe('0:00')
      expect(formatDurationFromISO('')).toBe('0:00')
    })
  })
})
