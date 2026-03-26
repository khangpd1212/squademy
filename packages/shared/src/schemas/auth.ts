import { z } from "zod";
import { VALIDATION } from "../constants/validation";

export const loginSchema = z.object({
  email: z.email("Please enter a valid email address."),
  password: z
    .string()
    .min(VALIDATION.PASSWORD_MIN, `Password must be at least ${VALIDATION.PASSWORD_MIN} characters.`)
    .max(VALIDATION.PASSWORD_MAX, "Password is too long."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.email("Please enter a valid email address."),
  password: z
    .string()
    .min(VALIDATION.PASSWORD_MIN, `Password must be at least ${VALIDATION.PASSWORD_MIN} characters.`)
    .max(VALIDATION.PASSWORD_MAX, "Password is too long."),
  displayName: z
    .string()
    .trim()
    .min(VALIDATION.DISPLAY_NAME_MIN, "Display name is required.")
    .max(VALIDATION.DISPLAY_NAME_MAX, "Display name is too long."),
  acceptPrivacy: z
    .boolean()
    .refine((v) => v === true, "You must accept the privacy policy."),
});

export type RegisterInput = z.infer<typeof registerSchema>;
