"use client";

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/browser-client";
import { queryKeys } from "@/lib/api/query-keys";

export interface SRSProgressWithCard {
  id: string;
  userId: string;
  deckId: string;
  cardId: string;
  grade: number;
  nextReviewDate: Date | null;
  lastReviewDate: Date | null;
  interval: number;
  easeFactor: number;
  repetitions: number;
  card: {
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
  deck: {
    id: string;
    title: string;
  };
}

interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  message?: string;
}

export function useDueCards(deckId?: string) {
  return useQuery({
    queryKey: queryKeys.srs.due(deckId),
    queryFn: async () => {
      const url = deckId
        ? `/srs-progress/due?deckId=${encodeURIComponent(deckId)}`
        : "/srs-progress/due";
      const result = await apiRequest<ApiResponse<SRSProgressWithCard[]>>(url);
      if (!result.data) {
        throw new Error(result.message ?? "Failed to fetch due cards");
      }
      return result.data;
    },
  });
}

export function useAheadCards(deckId?: string) {
  return useQuery({
    queryKey: queryKeys.srs.ahead(deckId),
    queryFn: async () => {
      const url = deckId
        ? `/srs-progress/ahead?deckId=${encodeURIComponent(deckId)}`
        : "/srs-progress/ahead";
      const result = await apiRequest<ApiResponse<SRSProgressWithCard[]>>(url);
      if (!result.data) {
        throw new Error(result.message ?? "Failed to fetch ahead cards");
      }
      return result.data;
    },
  });
}