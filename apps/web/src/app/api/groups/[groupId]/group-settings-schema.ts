import { z } from "zod";
import { optionalTrimmedString } from "@/app/api/groups/group-schema";

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
