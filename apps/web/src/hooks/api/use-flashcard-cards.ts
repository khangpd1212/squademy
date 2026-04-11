"use client";

import { useQuery } from "@tanstack/react-query";
import { FlashcardCard } from "@squademy/shared";
import { apiRequest } from "@/lib/api/browser-client";
import { queryKeys } from "@/lib/api/query-keys";
import { FlashcardCardItem } from "@/types/flashcard";
import {
  getOfflineCards,
  cacheDeck,
} from "@/lib/dexie/flashcards";

export function useFlashcardCards(deckId: string) {
  return useQuery({
    queryKey: queryKeys.flashcards.cards(deckId),
    queryFn: async () => {
      const result = await apiRequest<FlashcardCard[]>(
        `/flashcard-decks/${deckId}/cards`,
      );
      if (!result.data) {
        throw new Error(result.message ?? "Failed to fetch cards");
      }
      await cacheDeck(deckId, result.data);
      return result.data;
    },
    staleTime: 1000 * 60 * 30,
    enabled: !!deckId,
  });
}

export async function getCachedFlashcardCards(
  deckId: string,
): Promise<FlashcardCardItem[] | undefined> {
  return getOfflineCards(deckId);
}