import { z } from "zod";
import { videoSchema, parentSchema } from "./database.validator";

/**
 * API response schemas for type safety
 */

// Video responses
export const videoResponseSchema = z.object({
  video: videoSchema,
});

export const videosResponseSchema = z.object({
  videos: z.array(videoSchema),
});

export const videoWarningResponseSchema = z.object({
  warning: z.literal(true),
  message: z.string(),
  metadata: z.object({
    title: z.string(),
    madeForKids: z.boolean(),
  }),
});

// Parent responses
export const parentIdResponseSchema = z.object({
  parentId: z.string().uuid(),
});

// Success responses
export const successResponseSchema = z.object({
  success: z.literal(true),
});

export const watchTrackResponseSchema = z.object({
  success: z.literal(true),
  video: videoSchema,
});

// Device token responses
export const deviceTokenResponseSchema = z.object({
  success: z.boolean().optional(),
  token: z.string().optional(),
  parentId: z.string().uuid().nullable().optional(),
});

// Error responses (already defined in error-handler, but adding for completeness)
export const errorResponseSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  fields: z.record(z.string(), z.array(z.string())).optional(),
});
