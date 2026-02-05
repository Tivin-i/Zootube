import {
  youtubeVideoIdSchema,
  youtubeUrlSchema,
  videoIdParamSchema,
  createVideoSchema,
  videoQuerySchema,
} from '@/lib/validators/video.validator'

describe('Video Validators', () => {
  describe('youtubeVideoIdSchema', () => {
    it('should validate correct YouTube video IDs', () => {
      expect(() => youtubeVideoIdSchema.parse('dQw4w9WgXcQ')).not.toThrow()
      expect(() => youtubeVideoIdSchema.parse('abc123def45')).not.toThrow()
    })

    it('should reject invalid video IDs', () => {
      expect(() => youtubeVideoIdSchema.parse('')).toThrow()
      expect(() => youtubeVideoIdSchema.parse('too-short')).toThrow()
      expect(() => youtubeVideoIdSchema.parse('dQw4w9WgXcQ!')).toThrow() // Invalid character
      expect(() => youtubeVideoIdSchema.parse('dQw4w9WgXcQdQw4w9WgXcQ')).toThrow() // Too long
    })
  })

  describe('youtubeUrlSchema', () => {
    it('should validate correct YouTube URLs', () => {
      expect(() => youtubeUrlSchema.parse('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).not.toThrow()
      expect(() => youtubeUrlSchema.parse('https://youtu.be/dQw4w9WgXcQ')).not.toThrow()
      expect(() => youtubeUrlSchema.parse('https://youtube.com/watch?v=dQw4w9WgXcQ')).not.toThrow()
      expect(() => youtubeUrlSchema.parse('https://m.youtube.com/watch?v=dQw4w9WgXcQ')).not.toThrow()
    })

    it('should reject invalid URLs', () => {
      expect(() => youtubeUrlSchema.parse('not-a-url')).toThrow()
      expect(() => youtubeUrlSchema.parse('https://example.com/video')).toThrow()
      expect(() => youtubeUrlSchema.parse('http://youtube.com/watch?v=dQw4w9WgXcQ')).not.toThrow() // HTTP is valid
    })
  })

  describe('videoIdParamSchema', () => {
    it('should validate UUID format', () => {
      const validUUID = '123e4567-e89b-12d3-a456-426614174000'
      expect(() => videoIdParamSchema.parse({ id: validUUID })).not.toThrow()
    })

    it('should reject non-UUID format', () => {
      expect(() => videoIdParamSchema.parse({ id: 'not-a-uuid' })).toThrow()
      expect(() => videoIdParamSchema.parse({ id: '123' })).toThrow()
    })
  })

  describe('createVideoSchema', () => {
    it('should validate correct video creation data', () => {
      const validData = {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        household_id: '123e4567-e89b-12d3-a456-426614174000',
      }
      expect(() => createVideoSchema.parse(validData)).not.toThrow()
    })

    it('should reject invalid data', () => {
      expect(() => createVideoSchema.parse({
        url: 'invalid-url',
        household_id: '123e4567-e89b-12d3-a456-426614174000',
      })).toThrow()

      expect(() => createVideoSchema.parse({
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        household_id: 'not-a-uuid',
      })).toThrow()
    })
  })

  describe('videoQuerySchema', () => {
    it('should validate correct query parameters', () => {
      expect(() => videoQuerySchema.parse({
        household_id: '123e4567-e89b-12d3-a456-426614174000',
      })).not.toThrow()

      expect(() => videoQuerySchema.parse({
        household_id: '123e4567-e89b-12d3-a456-426614174000',
        page: '1',
        limit: '20',
      })).not.toThrow()
    })

    it('should coerce string numbers to numbers', () => {
      const result = videoQuerySchema.parse({
        household_id: '123e4567-e89b-12d3-a456-426614174000',
        page: '2',
        limit: '50',
      })
      expect(result.page).toBe(2)
      expect(result.limit).toBe(50)
    })

    it('should reject invalid parameters', () => {
      expect(() => videoQuerySchema.parse({
        household_id: 'not-a-uuid',
      })).toThrow()

      expect(() => videoQuerySchema.parse({
        household_id: '123e4567-e89b-12d3-a456-426614174000',
        page: '0', // Must be >= 1
      })).toThrow()
    })
  })
})
