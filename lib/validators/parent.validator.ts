import { z } from "zod";

/**
 * Email validation schema for parent lookup
 */
export const emailSchema = z
  .string()
  .email("Invalid email format")
  .min(1, "Email is required")
  .max(255, "Email is too long")
  .toLowerCase()
  .trim();

/**
 * Parent ID validation schema
 */
export const parentIdSchema = z
  .string()
  .uuid("Invalid parent ID format")
  .min(1, "Parent ID is required");

/**
 * Device token validation schema
 */
export const deviceTokenSchema = z
  .string()
  .min(1, "Device token is required")
  .max(500, "Device token is too long");

/**
 * Parent-by-email query schema
 */
export const parentByEmailQuerySchema = z.object({
  email: z.preprocess(
    (v) => (v === null || v === undefined ? "" : v),
    z.string().min(1, "Email is required").email("Invalid email format").transform((s) => s.toLowerCase().trim())
  ),
});
