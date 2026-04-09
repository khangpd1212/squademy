"use client";

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/browser-client";
import { queryKeys } from "@/lib/api/query-keys";

export type LearningPathItem = {
  id: string;
  sortOrder: number;
  lesson: {
    id: string;
    title: string;
    author: { displayName: string };
  } | null;
  deck: {
    id: string;
    title: string;
  } | null;
};

export function useGroupLearningPath(groupId: string) {
  return useQuery({
    queryKey: queryKeys.groups.learningPath(groupId),
    enabled: Boolean(groupId),
    queryFn: async () => {
      const result = await apiRequest<LearningPathItem[]>(`/groups/${groupId}/learning-path`);
      return result.data ?? [];
    },
  });
}