export const queryKeys = {
  auth: {
    me:  ["auth", "me"] as const,
  },
  users: {
    search: (query: string, groupId: string) =>
      ["users", "search", query, groupId] as const,
    profile: ["users", "profile"] as const,
  },
  groups: {
    myGroups: ["groups", "my"] as const,
    detail: (id: string) => ["groups", id] as const,
    members: (groupId: string) => ["groups", groupId, "members"] as const,
    inviteLink: (groupId: string) => ["groups", groupId, "invite-link"] as const,
  },
  invitations: {
    list: () => ["invitations"] as const,
  },
  lessons: {
    myLessons: ["lessons", "my"] as const,
    detail: (id: string) => ["lessons", id] as const,
    reviewQueue: ["lessons", "review"] as const,
    comments: (lessonId: string) => ["lessons", lessonId, "comments"] as const,
    publishedByGroup: (groupId: string) => ["lessons", "group", groupId, "published"] as const,
  },
} as const;
