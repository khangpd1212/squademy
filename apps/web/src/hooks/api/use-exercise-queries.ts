"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/browser-client";
import { queryKeys } from "@/lib/api/query-keys";

export type ExerciseQuestion = {
  id: string;
  type: "mcq" | "fill_blank" | "cloze" | "dictation" | "ipa_to_word";
  prompt: string;
  options?: { label: string; value: string }[];
  audioUrl?: string;
  ipa?: string;
  order: number;
  answers?: string | string[];
};

export type Exercise = {
  id: string;
  title: string;
  type: string;
  groupId: string;
  lessonId?: string;
  questions: ExerciseQuestion[];
};

export type ExerciseSubmission = {
  id: string;
  score: number;
  correctCount: number;
  totalCount: number;
  timeTaken: number;
  submittedAt: string;
};

export function useExercise(exerciseId: string) {
  return useQuery({
    queryKey: queryKeys.exercises.detail(exerciseId),
    queryFn: async () => {
      const result = await apiRequest<Exercise>(`/exercises/${exerciseId}`);
      if (!result.data) {
        throw new ApiError({
          message: result.message ?? "Failed to fetch exercise",
          code: result.code,
          status: result.status,
        });
      }
      return result.data;
    },
    enabled: !!exerciseId,
  });
}

export function useExerciseSubmissions(exerciseId: string) {
  return useQuery({
    queryKey: queryKeys.exercises.submissions(exerciseId),
    queryFn: async () => {
      const result = await apiRequest<ExerciseSubmission[]>(
        `/exercises/${exerciseId}/submissions`,
      );
      if (!result.data) {
        throw new ApiError({
          message: result.message ?? "Failed to fetch submissions",
          code: result.code,
          status: result.status,
        });
      }
      return result.data;
    },
    enabled: !!exerciseId,
  });
}

export function useSubmitExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      exerciseId,
      data,
    }: {
      exerciseId: string;
      data: {
        answers: { questionId: string; answer: string | string[] }[];
        timeTaken: number;
        focusEvents?: { type: string; timestamp: string }[];
      };
    }) => {
      const result = await apiRequest<{
        id: string;
        score: number;
        correctCount: number;
        totalCount: number;
        timeTaken: number;
      }>(`/exercises/${exerciseId}/submissions`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!result.data) {
        throw new ApiError({
          message: result.message ?? "Failed to submit exercise",
          code: result.code,
          status: result.status,
        });
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.exercises.submissions(variables.exerciseId),
      });
    },
  });
}