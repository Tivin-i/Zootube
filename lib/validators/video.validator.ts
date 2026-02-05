import { z } from "zod";
import { MAX_VIDEOS_PER_BATCH } from "@/lib/utils/constants";

/**
 * YouTube video ID validation schema
 */
export const youtubeVideoIdSchema = z
  .string()
  .min(1, "Video ID is required")
  .max(50, "Video ID is too long")
  .regex(/^[a-zA-Z0-9_-]{11}$/, "Invalid YouTube video ID format");

/**
 * YouTube URL validation schema
 */
export const youtubeUrlSchema = z
  .string()
  .url("Invalid URL format")
  .refine(
    (url) => {
      try {
        const urlObj = new URL(url);
        return (
          urlObj.hostname === "www.youtube.com" ||
          urlObj.hostname === "youtube.com" ||
          urlObj.hostname === "youtu.be" ||
          urlObj.hostname === "m.youtube.com"
        );
      } catch {
        return false;
      }
    },
    { message: "URL must be a valid YouTube URL" }
  );

/**
 * Video ID parameter validation schema
 */
export const videoIdParamSchema = z.object({
  id: z.string().uuid("Invalid video ID format"),
});

/**
 * Video creation schema
 */
export const createVideoSchema = z.object({
  url: youtubeUrlSchema,
  household_id: z.string().uuid("Invalid household ID format"),
});

/**
 * Video query parameters schema
 */
export const videoQuerySchema = z.object({
  household_id: z.string().uuid("Invalid household ID format"),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_VIDEOS_PER_BATCH).optional(),
});
