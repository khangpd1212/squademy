import { z } from "zod";

export const optionalTrimmedString = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Description must be ${max} characters or less.`)
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

export function toNullableDescription(description?: string) {
  const normalized = description?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}
