"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/browser-client";
import { queryKeys } from "@/lib/api/query-keys";
import { ProfileFormValues } from "@squademy/shared";

export type SearchResult = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

type ProfileApiResponse = {
  profile?: ProfileFormValues;
};

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.users.profile(),
    queryFn: async () => {
      const result = await apiRequest<ProfileFormValues>(
        "/users/me",
      );
      if (result.message) {
        return null;
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
    mutationFn: async (payload: ProfileFormValues) => {
      const result = await apiRequest<ProfileApiResponse>("/users/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.users.profile(),
      });
    },
  });
}

// TODO: Implement useUploadAvatar when Cloudflare R2 file storage is configured
