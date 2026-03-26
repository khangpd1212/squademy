import { z } from "zod";

export const memberRoleSchema = z.object({
  role: z.enum(["admin", "editor", "member"]),
});

export type MemberRoleInput = z.infer<typeof memberRoleSchema>;
