import { z } from "zod";

/**
 * YouTube batch request schema
 */
export const youtubeBatchSchema = z.object({
  url: z
    .string()
    .url("Invalid URL format")
    .refine(
      (url) => {
        try {
          const urlObj = new URL(url);
          return (
            urlObj.hostname === "www.youtube.com" ||
            urlObj.hostname === "youtube.com"
          );
        } catch {
          return false;
        }
      },
      { message: "URL must be a valid YouTube URL" }
    ),
  household_id: z.string().uuid("Invalid household ID format"),
  parent_id: z.string().uuid("Invalid parent ID format"),
  pageToken: z.string().optional(),
});
