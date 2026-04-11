"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlashcardDeck, FlashcardCard, FlashcardDeckDetail, CreateCardInput } from "@squademy/shared";
import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/browser-client";
import { queryKeys } from "@/lib/api/query-keys";

export type FlashcardDeckItem = FlashcardDeck;
export type FlashcardCardItem = FlashcardCard;

export function useFlashcardDecks() {
  return useQuery({
    queryKey: queryKeys.flashcards.myDecks,
    queryFn: async () => {
      const result = await apiRequest<FlashcardDeckItem[]>("/flashcard-decks");
      if (!result.data) {
        throw new ApiError({
          message: result.message ?? "Failed to fetch decks",
          code: result.code,
          status: result.status,
        });
      }
      return result.data;
    },
  });
}

export function useFlashcardDeck(deckId: string) {
  return useQuery({
    queryKey: queryKeys.flashcards.detail(deckId),
    queryFn: async () => {
      const result = await apiRequest<FlashcardDeckDetail>(
        `/flashcard-decks/${deckId}`,
      );
      if (!result.data) {
        throw new ApiError({
          message: result.message ?? "Failed to fetch deck",
          code: result.code,
          status: result.status,
        });
      }
      return result.data;
    },
    enabled: !!deckId,
  });
}

export function useCreateDeck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { title: string; description?: string }) => {
      const result = await apiRequest<FlashcardDeckItem>("/flashcard-decks", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!result.data) {
        throw new ApiError({
          message: result.message ?? "Failed to create deck",
          code: result.code,
          status: result.status,
        });
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.flashcards.all });
    },
  });
}

export function useDeleteDeck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deckId: string) => {
      const result = await apiRequest<{ success: boolean }>(
        `/flashcard-decks/${deckId}`,
        {
          method: "DELETE",
        },
      );
      if (!result.data) {
        throw new ApiError({
          message: result.message ?? "Failed to delete deck",
          code: result.code,
          status: result.status,
        });
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.flashcards.all });
    },
  });
}

export function useAddCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      deckId,
      data,
    }: {
      deckId: string;
      data: CreateCardInput;
    }) => {
      const result = await apiRequest<FlashcardCardItem>(
        `/flashcard-decks/${deckId}/cards`,
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      );
      if (!result.data) {
        throw new ApiError({
          message: result.message ?? "Failed to add card",
          code: result.code,
          status: result.status,
        });
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.flashcards.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.flashcards.detail(variables.deckId),
      });
    },
  });
}

export function useImportAnkiDeck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { title: string; cards: CreateCardInput[] }) => {
      const result = await apiRequest<FlashcardDeckItem>(
        "/flashcard-decks/import",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      );
      if (!result.data) {
        throw new ApiError({
          message: result.message ?? "Failed to import Anki deck",
          code: result.code,
          status: result.status,
        });
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.flashcards.all });
    },
  });
}

export type GroupFlashcardDeck = {
  id: string;
  title: string;
  description?: string;
  cardCount: number;
  updatedAt: string;
  author: { id: string; displayName: string };
};

export function useGroupFlashcardDecks(groupId: string) {
  return useQuery({
    queryKey: queryKeys.groups.groupFlashcardDecks(groupId),
    queryFn: async () => {
      const result = await apiRequest<GroupFlashcardDeck[]>(
        `/groups/${groupId}/flashcard-decks`,
      );
      if (!result.data) {
        throw new ApiError({
          message: result.message ?? "Failed to fetch group flashcard decks",
          code: result.code,
          status: result.status,
        });
      }
      return result.data;
    },
    staleTime: 60_000,
    enabled: !!groupId,
  });
}

export type DeckWithStatus = FlashcardDeckItem & { status: string };

export type DeckGroup = {
  groupId: string;
  groupName: string;
};

export function useDeckGroups(deckId: string) {
  return useQuery({
    queryKey: queryKeys.flashcards.groups(deckId),
    queryFn: async () => {
      const result = await apiRequest<DeckGroup[]>(
        `/flashcard-decks/${deckId}/groups`,
      );
      if (!result.data) {
        throw new ApiError({
          message: result.message ?? "Failed to fetch deck groups",
          code: result.code,
          status: result.status,
        });
      }
      return result.data;
    },
    enabled: !!deckId,
  });
}

export function useUpdatePublishGroups() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      deckId,
      groupIds,
    }: {
      deckId: string;
      groupIds: string[];
    }) => {
      const result = await apiRequest<{
        added: number;
        removed: number;
        published: boolean;
      }>(`/flashcard-decks/${deckId}/groups`, {
        method: "PATCH",
        body: JSON.stringify({ groupIds }),
      });
      if (!result.data) {
        throw new ApiError({
          message: result.message ?? "Failed to update publish groups",
          code: result.code,
          status: result.status,
        });
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.flashcards.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
    },
  });
}
