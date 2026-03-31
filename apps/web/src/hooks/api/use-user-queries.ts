"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/browser-client";
import { queryKeys } from "@/lib/api/query-keys";
import {
  type ProfileApiValues,
  type ProfileEditValues,
} from "@squademy/shared";

export type SearchResult = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  email: string;
};

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.users.profile,
    queryFn: async () => {
      const result = await apiRequest<ProfileApiValues>("/users/me");
      if (result.message) {
        throw new ApiError({
          message: result.message,
          code: result.code,
          status: result.status,
        });
      }
      return result.data;
    },
    retry: false,
  });
}

export function useSearchUsers(query: string, groupId: string) {
  const normalized = query.trim();

  return useQuery({
    queryKey: queryKeys.users.search(normalized, groupId),
    enabled: normalized.length >= 2,
    queryFn: async () => {
      const result = await apiRequest<SearchResult[]>(
        `/users/search?q=${encodeURIComponent(normalized)}&groupId=${groupId}`,
      );
      if (result.message) {
        throw new ApiError({ message: result.message, code: result.code, status: result.status });
      }
      return result.data ?? [];
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formValues: ProfileEditValues) => {
      const result = await apiRequest<ProfileApiValues>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          displayName: formValues.displayName,
          fullName: formValues.fullName,
          avatarUrl: formValues.avatarUrl ?? null,
          school: formValues.school,
          location: formValues.location,
          age: formValues.age,
        }),
      });

      if (result.message) {
        throw new ApiError({
          message: result.message ?? "Could not save profile.",
          code: result.code,
          status: result.status,
        });
      }

      return result.data;
    },
    onMutate: async (formValues) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users.profile });
      const previous = queryClient.getQueryData<ProfileApiValues>(queryKeys.users.profile);
      if (previous) {
        queryClient.setQueryData<ProfileApiValues>(
          queryKeys.users.profile,
          { 
            ...previous, 
            displayName: formValues.displayName,
            fullName: formValues.fullName,
            avatarUrl: formValues.avatarUrl ?? null,
            school: formValues.school,
            location: formValues.location,
            age: formValues.age,
          },
        );
      }
      return { previous };
    },
    onError: (_err, _formValues, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.users.profile, context.previous);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.users.profile,
      });
    },
  });
}

// TODO: Implement useUploadAvatar when Cloudflare R2 file storage is configured
