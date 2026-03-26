import { z } from "zod";

export const invalidCredentialsMessage = "Invalid email or password.";

export const loginSchema = z.object({
  email: z.email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required.").max(128, "Password is too long."),
});

export type LoginInput = z.infer<typeof loginSchema>;
