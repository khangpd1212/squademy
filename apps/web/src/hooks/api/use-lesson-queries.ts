"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type LessonStatus } from "@squademy/shared";
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
