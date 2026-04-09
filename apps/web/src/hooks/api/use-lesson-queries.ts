"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type LessonStatus, type ReactionType } from "@squademy/shared";
import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/browser-client";
import { queryKeys } from "@/lib/api/query-keys";

export type MyLessonItem = {
  id: string;
  title: string;
  status: LessonStatus;
  groupId: string;
  updatedAt: string;
  group: { name: string };
};

export type LessonDetail = {
  id: string;
  title: string;
  content: Record<string, unknown> | null;
  contentMarkdown: string | null;
  status: LessonStatus;
  groupId: string;
  authorId: string;
  updatedAt: string;
};

export type PublishedLessonItem = {
  id: string;
  title: string;
  contentMarkdown: string | null;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: { displayName: string | null; fullName: string | null; avatarUrl: string | null };
};

type CreateLessonResult = {
  id: string;
  title: string;
  status: LessonStatus;
  groupId: string;
};

type UpdateLessonParams = {
  lessonId: string;
  data: Partial<{
    title: string;
    content: Record<string, unknown> | null;
    contentMarkdown: string;
  }>;
};

export function useMyLessons() {
  return useQuery({
    queryKey: queryKeys.lessons.myLessons,
    queryFn: async () => {
      const result = await apiRequest<MyLessonItem[]>("/lessons?author=me");
      if (!result.data) {
        throw new ApiError({
          message: result.message ?? "Failed to fetch lessons",
          code: result.code,
          status: result.status,
        });
      }
      return result.data;
    },
  });
}

export function useLesson(lessonId: string) {
  return useQuery({
    queryKey: queryKeys.lessons.detail(lessonId),
    queryFn: async () => {
      const result = await apiRequest<LessonDetail>(`/lessons/${lessonId}`);
      if (!result.data) {
        throw new ApiError({
          message: result.message ?? "Failed to fetch lesson",
          code: result.code,
          status: result.status,
        });
      }
      return result.data;
    },
    enabled: !!lessonId,
  });
}

export function useUpdateLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ lessonId, data }: UpdateLessonParams) => {
      const result = await apiRequest<LessonDetail>(`/lessons/${lessonId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!result.data) {
        throw new ApiError({
          message: result.message ?? "Failed to update lesson",
          code: result.code,
          status: result.status,
        });
      }
      return result.data;
    },
    onSuccess: (data, { lessonId }) => {
      queryClient.setQueryData(queryKeys.lessons.detail(lessonId), data);
    },
  });
}

export function useCreateLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: string) => {
      const result = await apiRequest<CreateLessonResult>("/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      });
      if (!result.data) {
        throw new ApiError({
          message: result.message ?? "Failed to create lesson",
          code: result.code,
          status: result.status,
        });
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.myLessons });
    },
  });
}

export function useSubmitLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (lessonId: string) => {
      const result = await apiRequest<LessonDetail>(`/lessons/${lessonId}/submit`, {
        method: "PATCH",
      });
      if (!result.data) {
        throw new ApiError({
          message: result.message ?? "Failed to submit lesson",
          code: result.code,
          status: result.status,
        });
      }
      return result.data;
    },
    onSuccess: (data, lessonId) => {
      queryClient.setQueryData(queryKeys.lessons.detail(lessonId), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.myLessons });
    },
  });
}

export function useDeleteLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (lessonId: string) => {
      const result = await apiRequest(`/lessons/${lessonId}`, {
        method: "DELETE",
      });
      if (!result.data) {
        throw new ApiError({
          message: result.message ?? "Failed to delete lesson",
          code: result.code,
          status: result.status,
        });
      }
      return result;
    },
    onSuccess: async (_data, lessonId) => {
      queryClient.removeQueries({ queryKey: queryKeys.lessons.detail(lessonId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.lessons.myLessons });
    },
  });
}

export type ReviewQueueItem = {
  id: string;
  title: string;
  status: LessonStatus;
  createdAt: string;
  author: { displayName: string | null; fullName: string | null };
  group: { name: string };
};

export type ReviewLessonDetail = {
  id: string;
  title: string;
  content: Record<string, unknown> | null;
  contentMarkdown: string | null;
  status: LessonStatus;
  groupId: string;
  authorId: string;
  updatedAt: string;
  author: { displayName: string | null; fullName: string | null };
  group: { name: string };
};

export function useReviewQueue() {
  return useQuery({
    queryKey: queryKeys.lessons.reviewQueue,
    queryFn: async () => {
      const result = await apiRequest<ReviewQueueItem[]>("/lessons/review-queue");
      if (!result.data) {
        throw new ApiError({
          message: result.message ?? "Failed to fetch review queue",
          code: result.code,
          status: result.status,
        });
      }
      return result.data;
    },
  });
}

export function useReviewLesson(lessonId: string) {
  return useQuery({
    queryKey: ["lessons", "review", lessonId] as const,
    queryFn: async () => {
      const result = await apiRequest<ReviewLessonDetail>(`/lessons/review/${lessonId}`);
      if (!result.data) {
        throw new ApiError({
          message: result.message ?? "Failed to fetch lesson for review",
          code: result.code,
          status: result.status,
        });
      }
      return result.data;
    },
    enabled: !!lessonId,
  });
}

export function useApproveLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (lessonId: string) => {
      const result = await apiRequest(`/lessons/${lessonId}/approve`, {
        method: "PATCH",
      });
      if (!result.data) {
        throw new ApiError({
          message: result.message ?? "Failed to approve lesson",
          code: result.code,
          status: result.status,
        });
      }
      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["lessons"] });
    },
  });
}

export function useRejectLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ lessonId, feedback }: { lessonId: string; feedback: string }) => {
      const result = await apiRequest(`/lessons/${lessonId}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      });
      if (!result.data) {
        throw new ApiError({
          message: result.message ?? "Failed to reject lesson",
          code: result.code,
          status: result.status,
        });
      }
      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["lessons"] });
    },
  });
}

export type ReviewComment = {
  id: string;
  lessonId: string;
  userId: string;
  lineRef: string;
  body: string;
  parentId: string | null;
  createdAt: string;
  author: { displayName: string | null; fullName: string | null; avatarUrl: string | null };
};

export function useLessonComments(lessonId: string) {
  return useQuery({
    queryKey: queryKeys.lessons.comments(lessonId),
    queryFn: async () => {
      const result = await apiRequest<ReviewComment[]>(`/lessons/${lessonId}/comments`);
      if (!result.data) {
        throw new ApiError({
          message: result.message ?? "Failed to fetch comments",
          code: result.code,
          status: result.status,
        });
      }
      return result.data;
    },
    staleTime: 30_000,
    enabled: !!lessonId,
  });
}

type CreateCommentParams = {
  lessonId: string;
  lineRef: string;
  body: string;
  parentId?: string;
};

export function useCreateLessonComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ lessonId, lineRef, body, parentId }: CreateCommentParams) => {
      const result = await apiRequest<ReviewComment>(`/lessons/${lessonId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineRef, body, parentId }),
      });
      if (!result.data) {
        throw new ApiError({
          message: result.message ?? "Failed to create comment",
          code: result.code,
          status: result.status,
        });
      }
      return result.data;
    },
    onSuccess: (_data, { lessonId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.comments(lessonId) });
    },
  });
}

export function useDeleteLessonComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ lessonId, commentId }: { lessonId: string; commentId: string }) => {
      const result = await apiRequest(`/lessons/${lessonId}/comments/${commentId}`, {
        method: "DELETE",
      });
      if (!result.data) {
        throw new ApiError({
          message: result.message ?? "Failed to delete comment",
          code: result.code,
          status: result.status,
        });
      }
      return result;
    },
    onSuccess: async (_data, { lessonId }) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.lessons.comments(lessonId) });
    },
  });
}

export function useGroupPublishedLessons(groupId: string) {
  return useQuery({
    queryKey: queryKeys.lessons.publishedByGroup(groupId),
    queryFn: async () => {
      const result = await apiRequest<PublishedLessonItem[]>(`/lessons/group/${groupId}`);
      if (!result.data) {
        throw new ApiError({
          message: result.message ?? "Failed to fetch group lessons",
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

export type LessonReaction = {
  lineRef: string;
  type: ReactionType;
  count: number;
  userReacted: boolean;
};

export function useLessonReactions(lessonId: string) {
  return useQuery({
    queryKey: queryKeys.lessons.reactions(lessonId),
    queryFn: async () => {
      const result = await apiRequest<{ reactions: LessonReaction[] }>(`/lessons/${lessonId}/reactions`);
      return result.data?.reactions ?? [];
    },
    staleTime: 30_000,
    enabled: !!lessonId,
  });
}

export function useToggleReaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ lessonId, lineRef, reactionType }: { lessonId: string; lineRef: string; reactionType: ReactionType }) => {
      const result = await apiRequest<{ reaction: LessonReaction }>(`/lessons/${lessonId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineRef, reactionType }),
      });
      if (!result.data) {
        throw new ApiError({
          message: result.message ?? "Failed to toggle reaction",
          code: result.code,
          status: result.status,
        });
      }
      return result.data.reaction;
    },
    onSuccess: (_data, { lessonId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.reactions(lessonId) });
    },
  });
}

export type LessonProgress = {
  id: string;
  lessonId: string;
  userId: string;
  isRead: boolean;
  readAt: string | null;
};

export function useLessonProgress(lessonId: string) {
  return useQuery({
    queryKey: queryKeys.lessons.progress(lessonId),
    queryFn: async () => {
      const result = await apiRequest<LessonProgress>(`/lessons/${lessonId}/progress`);
      if (!result.data) {
        return null;
      }
      return result.data;
    },
    staleTime: 60_000,
    enabled: !!lessonId,
  });
}

export function useMarkLessonRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ lessonId, isRead = true }: { lessonId: string; isRead?: boolean }) => {
      const result = await apiRequest(`/lessons/${lessonId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead }),
      });
      if (!result.data) {
        throw new ApiError({
          message: result.message ?? "Failed to update progress",
          code: result.code,
          status: result.status,
        });
      }
      return result;
    },
    onSuccess: (_data, { lessonId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.progress(lessonId) });
    },
  });
}
