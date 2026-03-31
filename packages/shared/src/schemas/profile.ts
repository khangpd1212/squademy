import { z } from "zod";
import { VALIDATION } from "../constants/validation";

export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(VALIDATION.DISPLAY_NAME_MIN, "Display name is required.")
    .max(VALIDATION.DISPLAY_NAME_MAX, "Display name is too long."),
  email: z.email("Please enter a valid email address."),
  fullName: z
    .string()
    .trim()
    .max(VALIDATION.PROFILE_FIELD_MAX, "Full name is too long.")
    .nullable(),
  avatarUrl: z
    .union([
      z.url("Please enter a valid avatar URL."),
      z.null(),
    ])
    .optional(),
  school: z
    .string()
    .trim()
    .max(VALIDATION.PROFILE_FIELD_MAX, "School is too long.")
    .nullable(),
  location: z
    .string()
    .trim()
    .max(VALIDATION.PROFILE_FIELD_MAX, "Location is too long.")
    .nullable(),
  age: z.number().min(VALIDATION.AGE_MIN).max(VALIDATION.AGE_MAX).nullable(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export const profileEditSchema = profileSchema.omit({ email: true });

export type ProfileEditValues = z.infer<typeof profileEditSchema>;


export type ProfileApiValues = ProfileFormValues & {
  id: string;
};