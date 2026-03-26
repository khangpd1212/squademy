"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/browser-client";
import { queryKeys } from "@/lib/api/query-keys";

export type MemberRole = "admin" | "editor" | "member";

export type GroupMember = {
  user_id: string;
  role: string;
  joined_at: string;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
};

export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: queryKeys.groups.members(groupId),
    enabled: Boolean(groupId),
    queryFn: async () => {
      const result = await apiRequest<{
        members: Array<{
          userId: string;
          role: string;
          joinedAt: string;
          user: { displayName: string | null; avatarUrl: string | null } | null;
        }>;
      }>(`/groups/${groupId}`);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Could not load members.");
      }
      return (result.data.members ?? []).map((member) => ({
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
      if (result.error) {
        throw new Error(result.error);
      }
      return userId;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.groups.members(groupId) });
    },
  });
}

export function useUpdateMemberRole(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: MemberRole }) => {
      const result = await apiRequest(`/groups/${groupId}/members/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      if (result.error) {
        throw new Error(result.error);
      }
      return { userId, role };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.groups.members(groupId) });
    },
  });
}
