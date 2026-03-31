import { z } from "zod";
import { VALIDATION } from "../constants/validation";

export const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(VALIDATION.GROUP_NAME_MIN, "Group name is required.")
    .max(
      VALIDATION.GROUP_NAME_MAX,
      `Group name must be ${VALIDATION.GROUP_NAME_MAX} characters or less.`,
    ),
  description: z
    .string()
    .trim()
    .max(VALIDATION.GROUP_DESCRIPTION_MAX, "Description is too long.")
    .nullable(),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;

export const groupSettingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(VALIDATION.GROUP_NAME_MIN, "Group name is required.")
    .max(
      VALIDATION.GROUP_NAME_MAX,
      `Group name must be ${VALIDATION.GROUP_NAME_MAX} characters or less.`,
    ),
  description: z
    .string()
    .trim()
    .max(VALIDATION.GROUP_DESCRIPTION_MAX, "Description is too long.")
    .nullable(),
  exerciseDeadlineDay: z
    .number()
    .int()
    .min(VALIDATION.DEADLINE_DAY_MIN)
    .max(VALIDATION.DEADLINE_DAY_MAX)
    .nullable()
    .optional(),
  exerciseDeadlineTime: z
    .string()
    .regex(VALIDATION.DEADLINE_TIME_REGEX, "Time must be in HH:MM format (00:00–23:59).")
    .nullable()
    .optional()
    .or(z.literal("")),
});

export type GroupSettingsInput = z.infer<typeof groupSettingsSchema>;

export type GroupApiValues = {
  id: string;
  name: string;
  description: string | null;
  exerciseDeadlineDay: number | null;
  exerciseDeadlineTime: string | null;
  inviteCode?: string;
};
