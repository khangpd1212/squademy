import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  displayName: z
    .string()
    .trim()
    .min(1, "Display name is required.")
    .max(50, "Display name must be 50 characters or less."),
  acceptPrivacy: z.boolean().refine((v) => v === true, {
    message: "You must accept the privacy policy.",
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
