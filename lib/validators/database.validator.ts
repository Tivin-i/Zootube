import { z } from "zod";

/**
 * Zod schemas for database types
 * These provide runtime validation and type inference
 */

export const videoSchema = z.object({
  id: z.string().uuid(),
  household_id: z.string().uuid(),
  added_by: z.string().uuid().nullable(),
  youtube_id: z.string(),
  title: z.string().nullable(),
  thumbnail_url: z.string().url().nullable(),
  duration_seconds: z.number().int().nonnegative().nullable(),
  made_for_kids: z.boolean().nullable(),
  watch_count: z.number().int().nonnegative(),
  last_watched_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
});

export const parentSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  created_at: z.string().datetime(),
});
