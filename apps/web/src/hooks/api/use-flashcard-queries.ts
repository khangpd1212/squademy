"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/browser-client";
import { queryKeys } from "@/lib/api/query-keys";

export type FlashcardDeckItem = {
  id: string;
  title: string;
  description?: string;
  status: string;
  cardCount: number;
  createdAt: string;
  updatedAt: string;
};

export type FlashcardCardItem = {
  id: string;
  front: string;
  back: string | null;
  pronunciation: string | null;
  audioUrl: string | null;
  exampleSentence: string | null;
  imageUrl: string | null;
  tags: string[] | null;
  extraNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FlashcardDeckDetail = FlashcardDeckItem & {
  cards: FlashcardCardItem[];
};

export type CreateCardInput = {
  front: string;
  back?: string;
  pronunciation?: string;
  exampleSentence?: string;
  tags?: string[];
  extraNotes?: string;
};

export function useFlashcardDecks() {
  return useQuery({
    queryKey: ["flashcard-decks", "my"] as const,
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
    queryKey: ["flashcard-decks", deckId] as const,
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
      queryClient.invalidateQueries({ queryKey: ["flashcard-decks"] });
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
      queryClient.invalidateQueries({ queryKey: ["flashcard-decks"] });
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
      queryClient.invalidateQueries({ queryKey: ["flashcard-decks"] });
      queryClient.invalidateQueries({
        queryKey: ["flashcard-decks", variables.deckId],
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
      queryClient.invalidateQueries({ queryKey: ["flashcard-decks"] });
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
    queryKey: ["flashcard-decks", deckId, "groups"] as const,
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
      queryClient.invalidateQueries({ queryKey: ["flashcard-decks"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}
