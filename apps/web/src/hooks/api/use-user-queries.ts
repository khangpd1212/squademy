"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/browser-client";
import { queryKeys } from "@/lib/api/query-keys";

export type SearchResult = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

type ProfileApiResponse = {
  message?: string;
  field?: "displayName" | "fullName" | "school" | "location" | "age";
  profile?: {
    displayName: string | null;
    avatarUrl: string | null;
    fullName: string | null;
    school: string | null;
    location: string | null;
    age: number | null;
  };
};

type UpdateProfileInput = {
  displayName: string;
  fullName: string | null;
  school: string | null;
  location: string | null;
  age: number | null;
  avatarUrl?: string | null;
};

export type UserProfile = {
  id: string;
  email: string;
  displayName: string;
  fullName: string | null;
  avatarUrl: string | null;
  school: string | null;
  location: string | null;
  age: number | null;
};

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.users.profile(),
    queryFn: async () => {
      const result = await apiRequest<UserProfile>("/users/me");
      if (result.error) {
        return null;
      }
      return result.data ?? null;
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
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data ?? [];
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateProfileInput) => {
      const result = await apiRequest<ProfileApiResponse>("/users/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      if (result.error) {
        const responseBody = (result.raw ?? {}) as ProfileApiResponse;
        const err = new Error(result.error ?? "Could not save profile.");
        (
          err as Error & {
            field?: ProfileApiResponse["field"];
            responseBody?: ProfileApiResponse;
          }
        ).field = responseBody.field;
        (
          err as Error & {
            field?: ProfileApiResponse["field"];
            responseBody?: ProfileApiResponse;
          }
        ).responseBody = responseBody;
        throw err;
      }

      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.profile() });
    },
  });
}

// TODO: Implement useUploadAvatar when Cloudflare R2 file storage is configured
