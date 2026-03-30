"use client";

import { type MemberRole } from "@squademy/shared";
import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/browser-client";
import { queryKeys } from "@/lib/api/query-keys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type GroupMember = {
  user_id: string;
  role: string;
  joined_at: string;
  profiles: { display_name: string; avatar_url: string | null } | null;
};

export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: queryKeys.groups.members(groupId),
    enabled: Boolean(groupId),
    queryFn: async () => {
      const result = await apiRequest<
        Array<{
          userId: string;
          role: string;
          joinedAt: string;
          user: { id: string; displayName: string; avatarUrl: string | null };
        }>
      >(`/groups/${groupId}/members`);
      if (result.message || !result.data) {
        throw new ApiError({
          message: result.message ?? "Could not load members.",
          code: result.code,
          status: result.status,
        });
      }
      return (result.data ?? []).map((member): GroupMember => ({
        user_id: member.userId,
        role: member.role,
        joined_at: member.joinedAt,
        profiles: member.user
          ? {
              display_name: member.user.displayName,
              avatar_url: member.user.avatarUrl,
            }
          : null,
      }));
    },
  });
}

export function useRemoveMember(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await apiRequest(`/groups/${groupId}/members/${userId}`, {
        method: "DELETE",
      });
      if (result.message) {
        throw new ApiError({
          message: result.message,
          code: result.code,
          status: result.status,
        });
      }
      return userId;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.groups.detail(groupId),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.groups.members(groupId),
      });
    },
  });
}

export function useUpdateMemberRole(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: MemberRole;
    }) => {
      const result = await apiRequest(
        `/groups/${groupId}/members/${userId}/role`,
        {
          method: "PATCH",
          body: JSON.stringify({ role }),
        },
      );
      if (result.message) {
        throw new ApiError({
          message: result.message,
          code: result.code,
          status: result.status,
        });
      }
      return { userId, role };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.groups.detail(groupId),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.groups.members(groupId),
      });
    },
  });
}
