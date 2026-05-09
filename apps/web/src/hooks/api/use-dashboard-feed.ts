"use client";

import { useQueries } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/browser-client";
import { queryKeys } from "@/lib/api/query-keys";
import { useMyGroups } from "@/hooks/api/use-group-queries";
import type { PublishedLessonItem } from "@/hooks/api/use-lesson-queries";
import type { GroupFlashcardDeck } from "@/hooks/api/use-flashcard-queries";

export type DashboardDeckItem = GroupFlashcardDeck & {
  groupName: string;
  groupId: string;
};

export type DashboardLessonItem = PublishedLessonItem & {
  groupName: string;
  groupId: string;
};

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function useDashboardFeed() {
  const groupsQuery = useMyGroups();
  const groups = groupsQuery.data ?? [];

  const deckQueries = useQueries({
    queries: groups.map((group) => ({
      queryKey: queryKeys.groups.groupFlashcardDecks(group.id),
      queryFn: async (): Promise<DashboardDeckItem[]> => {
        const result = await apiRequest<GroupFlashcardDeck[]>(
          `/groups/${group.id}/flashcard-decks`,
        );
        if (!result.data) return [];
        return result.data.map((deck) => ({
          ...deck,
          groupName: group.name,
          groupId: group.id,
        }));
      },
      enabled: groups.length > 0,
      staleTime: 60_000,
    })),
  });

  const lessonQueries = useQueries({
    queries: groups.map((group) => ({
      queryKey: queryKeys.lessons.publishedByGroup(group.id),
      queryFn: async (): Promise<DashboardLessonItem[]> => {
        const result = await apiRequest<PublishedLessonItem[]>(
          `/lessons/group/${group.id}`,
        );
        if (!result.data) return [];
        return result.data.map((lesson) => ({
          ...lesson,
          groupName: group.name,
          groupId: group.id,
        }));
      },
      enabled: groups.length > 0,
      staleTime: 60_000,
    })),
  });

  const allDecks = deckQueries.flatMap((q) => q.data ?? []);
  const allLessons = lessonQueries.flatMap((q) => q.data ?? []);
  const shuffledLessons = shuffle(allLessons);

  const isLoading =
    groupsQuery.isLoading ||
    deckQueries.some((q) => q.isLoading) ||
    lessonQueries.some((q) => q.isLoading);

  return {
    groups,
    groupsQuery,
    decks: allDecks,
    lessons: shuffledLessons,
    isLoading,
    totalDecks: allDecks.length,
    totalLessons: allLessons.length,
  };
}
