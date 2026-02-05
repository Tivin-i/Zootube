import { z } from "zod";

export const householdIdSchema = z.string().uuid("Invalid household ID format");

export const createHouseholdSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
});

export const inviteMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const householdQuerySchema = z.object({
  household_id: householdIdSchema,
});
