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
    all: ["groups"] as const,
    myGroups: ["groups", "my"] as const,
    detail: (id: string) => ["groups", id] as const,
    members: (groupId: string) => ["groups", groupId, "members"] as const,
    inviteLink: (groupId: string) => ["groups", groupId, "invite-link"] as const,
    learningPath: (groupId: string) => ["groups", groupId, "learning-path"] as const,
    groupFlashcardDecks: (groupId: string) => ["groups", groupId, "flashcard-decks"] as const,
  },
  invitations: {
    list: () => ["invitations"] as const,
  },
  flashcards: {
    myDecks: ["flashcard-decks", "my"] as const,
    detail: (deckId: string) => ["flashcard-decks", deckId] as const,
    all: ["flashcard-decks"] as const,
    cards: (deckId: string) => ["flashcards", deckId, "cards"] as const,
    groups: (deckId: string) => ["flashcard-decks", deckId, "groups"] as const,
  },
  lessons: {
    myLessons: ["lessons", "my"] as const,
    detail: (id: string) => ["lessons", id] as const,
    reviewQueue: ["lessons", "review"] as const,
    comments: (lessonId: string) => ["lessons", lessonId, "comments"] as const,
    publishedByGroup: (groupId: string) => ["lessons", "group", groupId, "published"] as const,
    reactions: (lessonId: string) => ["lessons", lessonId, "reactions"] as const,
    progress: (lessonId: string) => ["lessons", lessonId, "progress"] as const,
  },
} as const;
