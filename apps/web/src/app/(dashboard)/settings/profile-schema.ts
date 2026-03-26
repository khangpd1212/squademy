import { z } from "zod";

export const maxAvatarSizeBytes = 2 * 1024 * 1024;
export const allowedAvatarMimeTypes = ["image/jpeg", "image/png"] as const;

export const profileFormSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Display name is required.")
    .max(50, "Display name is too long."),
  fullName: z.string().trim().max(120, "Full name is too long."),
  school: z.string().trim().max(120, "School is too long."),
  location: z.string().trim().max(120, "Location is too long."),
  age: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d+$/.test(value), "Age must be a whole number.")
    .refine((value) => {
      if (value === "") {
        return true;
      }

      const age = Number(value);
      return age >= 5 && age <= 120;
    }, "Age must be between 5 and 120."),
});

const optionalTrimmedString = (max: number, fieldName: string) =>
  z
    .string()
    .trim()
    .max(max, `${fieldName} is too long.`)
    .optional()
    .or(z.literal(""));

export const profileUpdateSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Display name is required.")
    .max(50, "Display name is too long."),
  fullName: optionalTrimmedString(120, "Full name"),
  school: optionalTrimmedString(120, "School"),
  location: optionalTrimmedString(120, "Location"),
  age: z
    .preprocess((value) => {
      if (value === "" || value === null || typeof value === "undefined") {
        return undefined;
      }

      if (typeof value === "number") {
        return value;
      }

      if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isNaN(parsed) ? value : parsed;
      }

      return value;
    }, z.number().int("Age must be a whole number.").min(5).max(120).optional()),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function toNullableProfileValue(value?: string) {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}
