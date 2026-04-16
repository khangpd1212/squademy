"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/browser-client";
import { queryKeys } from "@/lib/api/query-keys";

export type RoadmapItem = {
  id: string;
  sortOrder: number;
  lesson: {
    id: string;
    title: string;
    status: string;
    author: { displayName: string };
  } | null;
  deck: {
    id: string;
    title: string;
  } | null;
};

export type AvailableItem = {
  id: string;
  title: string;
  status?: string;
  author?: { displayName: string };
};

export type RoadmapData = {
  inPath: RoadmapItem[];
  availableLessons: AvailableItem[];
  availableDecks: AvailableItem[];
};

export function useLearningPathEdit(groupId: string) {
  return useQuery({
    queryKey: queryKeys.groups.learningPathEdit(groupId),
    enabled: Boolean(groupId),
    queryFn: async () => {
      const result = await apiRequest<RoadmapData>(
        `/groups/${groupId}/learning-path/edit`,
      );
      if (result.message) {
        throw new Error(result.message);
      }
      return result.data;
    },
  });
}

export function useReorderLearningPath(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemIds: string[]) => {
      const result = await apiRequest<RoadmapItem[]>(
        `/groups/${groupId}/learning-path/reorder`,
        {
          method: "PATCH",
          body: JSON.stringify({ itemIds }),
        },
      );
      if (result.message) {
        throw new Error(result.message);
      }
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.groups.learningPathEdit(groupId), {
        inPath: data,
        availableLessons: [],
        availableDecks: [],
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.learningPath(groupId),
      });
    },
  });
}

export function useAddToLearningPath(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ lessonId, deckId }: { lessonId?: string; deckId?: string }) => {
      const result = await apiRequest<RoadmapItem>(
        `/groups/${groupId}/learning-path`,
        {
          method: "POST",
          body: JSON.stringify({ lessonId, deckId }),
        },
      );
      if (result.message) {
        throw new Error(result.message);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.learningPathEdit(groupId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.learningPath(groupId),
      });
    },
  });
}

export function useRemoveFromLearningPath(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const result = await apiRequest(
        `/groups/${groupId}/learning-path/${itemId}`,
        {
          method: "DELETE",
        },
      );
      if (result.message) {
        throw new Error(result.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.learningPathEdit(groupId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.learningPath(groupId),
      });
    },
  });
}