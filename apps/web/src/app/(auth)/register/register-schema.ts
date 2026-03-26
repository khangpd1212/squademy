import { z } from "zod";

export const duplicateEmailMessage = "An account with this email already exists.";

export const registerSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Display name is required.")
    .max(80, "Display name is too long."),
  email: z.email("Please enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password is too long."),
  acceptPrivacy: z
    .boolean()
    .refine((value) => value, "You must accept the privacy policy."),
});

export type RegisterInput = z.infer<typeof registerSchema>;
