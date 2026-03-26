export const GROUP_ROLES = {
  ADMIN: "admin",
  EDITOR: "editor",
  MEMBER: "member",
} as const;

export const INVITATION_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  DECLINED: "declined",
} as const;

export const LESSON_STATUS = {
  DRAFT: "draft",
  REVIEW: "review",
  PUBLISHED: "published",
} as const;
