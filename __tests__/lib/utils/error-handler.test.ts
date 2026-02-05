import { handleApiError } from '@/lib/utils/error-handler'
import {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  RateLimitError,
  AppError,
} from '@/lib/errors/app-errors'

describe('Error Handler', () => {
  it('should handle ValidationError', async () => {
    const error = new ValidationError('Invalid input')
    const response = handleApiError(error)
    
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Invalid input')
  })

  it('should handle NotFoundError', async () => {
    const error = new NotFoundError('Video')
    const response = handleApiError(error)
    
    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toContain('Video')
  })

  it('should handle UnauthorizedError', async () => {
    const error = new UnauthorizedError('Authentication required')
    const response = handleApiError(error)
    
    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe('Authentication required')
  })

  it('should handle RateLimitError', async () => {
    const error = new RateLimitError('Too many requests')
    const response = handleApiError(error)
    
    expect(response.status).toBe(429)
    const data = await response.json()
    expect(data.error).toBe('Too many requests')
  })

  it('should handle generic AppError', async () => {
    const error = new AppError('Something went wrong', 500)
    const response = handleApiError(error)
    
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Something went wrong')
  })

  it('should handle unknown errors in production', async () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    
    const error = new Error('Sensitive error message')
    const response = handleApiError(error)
    
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Internal server error')
    process.env.NODE_ENV = originalEnv
  })

  it('should show error details in development', async () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    
    const error = new Error('Development error message')
    const response = handleApiError(error)
    
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Development error message')
    process.env.NODE_ENV = originalEnv
  })

  // Note: ZodError test skipped due to Next.js server mocking complexity
  // This functionality is tested in integration tests
})
