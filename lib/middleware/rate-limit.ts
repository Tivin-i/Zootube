import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";
import { RateLimitError } from "@/lib/errors/app-errors";

// Initialize Redis client (use environment variables in production)
// For development, we'll use a simple in-memory fallback.
// Use separate limiters per type so auth read-heavy endpoints don't share a tiny bucket with strict auth actions.
let limiters: {
  public: Ratelimit | null;
  auth: Ratelimit | null;
  videoAdd: Ratelimit | null;
} = { public: null, auth: null, videoAdd: null };

try {
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    limiters = {
      public: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, "15 m"),
        analytics: true,
      }),
      auth: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(60, "15 m"),
        analytics: true,
      }),
      videoAdd: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, "60 m"),
        analytics: true,
      }),
    };
  }
} catch (error) {
  console.warn("Rate limiting disabled: Redis not configured", error);
}

// In-memory rate limiter for development (simple implementation)
class InMemoryRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(maxRequests: number, windowMinutes: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMinutes * 60 * 1000;
  }

  async limit(identifier: string): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get or create request history for this identifier
    let requests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    requests = requests.filter((timestamp) => timestamp > windowStart);
    
    // Check if limit exceeded
    if (requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...requests);
      const reset = oldestRequest + this.windowMs;
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        reset: Math.ceil((reset - now) / 1000),
      };
    }

    // Add current request
    requests.push(now);
    this.requests.set(identifier, requests);

    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - requests.length,
      reset: Math.ceil(this.windowMs / 1000),
    };
  }
}

// Create in-memory rate limiters for different endpoints (aligned with Upstash limits)
const rateLimiters = {
  // Public endpoints: 100 requests per 15 minutes
  public: new InMemoryRateLimiter(100, 15),
  // Auth endpoints: 60 requests per 15 minutes (read-heavy: children, youtube-connection, households, etc.)
  auth: new InMemoryRateLimiter(60, 15),
  // Video add: 20 requests per hour
  videoAdd: new InMemoryRateLimiter(20, 60),
};

/**
 * Get client identifier from request (IP address).
 * In production the app must run behind a trusted proxy that sets x-forwarded-for or x-real-ip;
 * otherwise these headers can be spoofed by the client.
 */
function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() || realIp || "unknown";
  return ip;
}

/**
 * Apply rate limiting to a request
 */
export async function applyRateLimit(
  request: NextRequest,
  type: "public" | "auth" | "videoAdd" = "public"
): Promise<void> {
  const limiter = limiters[type];
  if (limiter) {
    const identifier = `${type}:${getClientIdentifier(request)}`;
    const result = await limiter.limit(identifier);

    if (!result.success) {
      throw new RateLimitError(
        `Rate limit exceeded. Try again in ${result.reset} seconds.`
      );
    }
  } else {
    // Use in-memory limiter
    const limiter = rateLimiters[type];
    const identifier = getClientIdentifier(request);
    const result = await limiter.limit(identifier);
    
    if (!result.success) {
      throw new RateLimitError(
        `Rate limit exceeded. Try again in ${result.reset} seconds.`
      );
    }
  }
}
