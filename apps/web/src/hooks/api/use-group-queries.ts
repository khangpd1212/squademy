"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/browser-client";
import { queryKeys } from "@/lib/api/query-keys";

export type GroupDetail = {
  id: string;
  name: string;
  description: string | null;
  exerciseDeadlineDay: number | null;
  exerciseDeadlineTime: string | null;
  inviteCode?: string;
  members: Array<{
    userId: string;
    role: string;
    joinedAt: string;
    user: {
      displayName: string;
      avatarUrl?: string;
    };
  }>;
  lessons?: Array<{ id: string }>;
};

type CreateGroupInput = {
  name: string;
  description?: string;
};

type UpdateGroupPayload = {
  name: string;
  description: string;
  exerciseDeadlineDay: number | null;
  exerciseDeadlineTime: string | null;
};

export function useGroup(groupId: string) {
  return useQuery({
    queryKey: queryKeys.groups.detail(groupId),
    enabled: Boolean(groupId),
    queryFn: async () => {
      const result = await apiRequest<GroupDetail>(`/groups/${groupId}`);
      if (result.message || !result.data) {
        throw new ApiError({
          message: result.message ?? "Could not load group.",
          code: result.code,
          status: result.status,
        });
      }
      return result.data;
    },
  });
}

export function useCreateGroup() {
  return useMutation({
    mutationFn: async (values: CreateGroupInput) => {
      const result = await apiRequest<{ id: string; name: string; inviteCode: string }>(
        "/groups",
        {
          method: "POST",
          body: JSON.stringify(values),
        },
      );
      if (result.message || !result.data) {
        throw new ApiError({
          message: result.message ?? "Could not create group.",
          code: result.code,
          status: result.status,
        });
      }
      return result.data;
    },
  });
}

export function useUpdateGroup(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: UpdateGroupPayload) => {
      const result = await apiRequest(`/groups/${groupId}`, {
        method: "PATCH",
        body: JSON.stringify(values),
      });
      if (result.message) {
        throw new ApiError({
          message: result.message ?? "Could not save settings.",
          code: result.code,
          status: result.status,
        });
      }
      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) });
    },
  });
}

export function useJoinGroup() {
  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const result = await apiRequest<{ id?: string; group?: { id: string } }>("/groups/join", {
        method: "POST",
        body: JSON.stringify({ inviteCode }),
      });
      if (result.message) {
        throw new ApiError({ message: result.message, code: result.code, status: result.status });
      }
      const groupId = result.data?.id ?? result.data?.group?.id;
      if (!groupId) {
        throw new Error("Could not join group.");
      }
      return groupId;
    },
  });
}

export function useGenerateInviteLink(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await apiRequest<{ inviteCode?: string }>(`/groups/${groupId}/invite-link`, {
        method: "POST",
      });
      if (result.message) {
        throw new ApiError({ message: result.message, code: result.code, status: result.status });
      }
      if (!result.data?.inviteCode) {
        throw new Error("Could not regenerate invite link.");
      }
      return result.data.inviteCode;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.groups.inviteLink(groupId) });
    },
  });
}
