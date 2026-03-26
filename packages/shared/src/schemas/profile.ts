import { z } from "zod";
import { VALIDATION } from "../constants/validation";
import { optionalTrimmedString } from "./group";

export const profileFormSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(VALIDATION.DISPLAY_NAME_MIN, "Display name is required.")
    .max(VALIDATION.DISPLAY_NAME_MAX, "Display name is too long."),
  fullName: optionalTrimmedString(VALIDATION.PROFILE_FIELD_MAX, "Full name"),
  school: optionalTrimmedString(VALIDATION.PROFILE_FIELD_MAX, "School"),
  location: optionalTrimmedString(VALIDATION.PROFILE_FIELD_MAX, "Location"),
  age: z.number().int("Age must be a whole number.").min(VALIDATION.AGE_MIN).max(VALIDATION.AGE_MAX).nullable(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
