import { z } from "zod";

export const ROLES = ["admin", "editor", "member"] as const;
export type Role = (typeof ROLES)[number];

export const memberRoleSchema = z.object({
  role: z.enum(ROLES),
});

export type MemberRoleInput = z.infer<typeof memberRoleSchema>;
