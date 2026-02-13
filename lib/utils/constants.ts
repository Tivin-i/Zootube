/**
 * Application-wide constants
 * All hardcoded values should be moved here for better maintainability
 */

// Video Management
export const MAX_VIDEOS_PER_BATCH = 100;
export const MAX_RECOMMENDATIONS = 6;

// Device Token Configuration
export const DEVICE_TOKEN_EXPIRY_DAYS = 90;
export const TOKEN_LENGTH = 32;
export const DEVICE_TOKEN_COOKIE_NAME = "voobi_device_token";
export const PARENT_ID_COOKIE_NAME = "voobi_parent_id_secure";

// UI Defaults
export const DEFAULT_CHILD_NAME = "Zoe";

// YouTube Player Configuration
export const YOUTUBE_PLAYER_MIN_WIDTH = 200;
export const YOUTUBE_PLAYER_MIN_HEIGHT = 200;

// Rate Limiting (for reference - actual config in rate-limit.ts)
export const RATE_LIMIT_PUBLIC_REQUESTS = 100;
export const RATE_LIMIT_PUBLIC_WINDOW_MINUTES = 15;
export const RATE_LIMIT_AUTH_REQUESTS = 10;
export const RATE_LIMIT_AUTH_WINDOW_MINUTES = 15;
export const RATE_LIMIT_VIDEO_ADD_REQUESTS = 20;
export const RATE_LIMIT_VIDEO_ADD_WINDOW_HOURS = 1;

// Caching
export const CACHE_TTL_YOUTUBE_METADATA_SECONDS = 24 * 60 * 60; // 24 hours
export const CACHE_TTL_VIDEO_LIST_SECONDS = 5 * 60; // 5 minutes
export const CACHE_TTL_PARENT_LOOKUP_SECONDS = 60; // 1 minute

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
