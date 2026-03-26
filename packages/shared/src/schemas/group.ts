import { z } from "zod";

export const optionalTrimmedString = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or less.`)
    .optional()
    .or(z.literal(""));

export const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Group name is required.")
    .max(100, "Group name must be 100 characters or less."),
  description: optionalTrimmedString(500),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;

export const groupSettingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Group name is required.")
    .max(100, "Group name must be 100 characters or less."),
  description: optionalTrimmedString(500),
  exercise_deadline_day: z.number().int().min(0).max(6).nullable().optional(),
  exercise_deadline_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format.")
    .nullable()
    .optional()
    .or(z.literal("")),
});

export type GroupSettingsInput = z.infer<typeof groupSettingsSchema>;

export function toNullableDescription(description?: string) {
  const normalized = description?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}
