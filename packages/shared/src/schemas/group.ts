import { z } from "zod";
import { VALIDATION } from "../constants/validation";

export const optionalTrimmedString = (max: number, fieldName?: string) =>
  z
    .string()
    .trim()
    .max(
      max,
      fieldName
        ? `${fieldName} is too long.`
        : `Must be ${max} characters or less.`,
    )
    .optional()
    .or(z.literal(""));

export function toNullableString(value?: string) {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}

export const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(VALIDATION.GROUP_NAME_MIN, "Group name is required.")
    .max(VALIDATION.GROUP_NAME_MAX, `Group name must be ${VALIDATION.GROUP_NAME_MAX} characters or less.`),
  description: optionalTrimmedString(VALIDATION.GROUP_DESCRIPTION_MAX),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;

export const groupSettingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(VALIDATION.GROUP_NAME_MIN, "Group name is required.")
    .max(VALIDATION.GROUP_NAME_MAX, `Group name must be ${VALIDATION.GROUP_NAME_MAX} characters or less.`),
  description: optionalTrimmedString(VALIDATION.GROUP_DESCRIPTION_MAX),
  exercise_deadline_day: z
    .number()
    .int()
    .min(VALIDATION.DEADLINE_DAY_MIN)
    .max(VALIDATION.DEADLINE_DAY_MAX)
    .nullable()
    .optional(),
  exercise_deadline_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format.")
    .nullable()
    .optional()
    .or(z.literal("")),
});

export type GroupSettingsInput = z.infer<typeof groupSettingsSchema>;
