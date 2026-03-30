"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { INVITATION_STATUS } from "@squademy/shared";
import { ApiError } from "@/lib/api/api-error";
import { apiRequest } from "@/lib/api/browser-client";
import { queryKeys } from "@/lib/api/query-keys";

export type InvitationType = {
  id: string;
  groupId: string;
  groupName: string;
  invitedByName: string;
  createdAt: string;
};

type InvitationData = {
  id: string;
  groupId: string;
  createdAt: string;
  group: { id: string; name: string };
  inviter: { id: string; displayName: string | null };
};

export function useInvitations() {
  return useQuery({
    queryKey: queryKeys.invitations.list(),
    queryFn: async () => {
      const result = await apiRequest<InvitationData[]>("/invitations");
      if (result.message) {
        throw new ApiError({ message: result.message, code: result.code, status: result.status });
      }
      return (result.data ?? []).map((inv) => ({
        id: inv.id,
        groupId: inv.groupId ?? inv.group?.id ?? "",
        groupName: inv.group?.name ?? "Unknown group",
        invitedByName: inv.inviter?.displayName ?? "Someone",
        createdAt: inv.createdAt,
      }));
    },
  });
}

export function useCreateInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, inviteeId }: { groupId: string; inviteeId: string }) => {
      const result = await apiRequest("/invitations", {
        method: "POST",
        body: JSON.stringify({ groupId, inviteeId }),
      });
      if (result.message) {
        throw new ApiError({ message: result.message, code: result.code, status: result.status });
      }
      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.invitations.list() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.groups.myGroups });
    },
  });
}

export function useRespondInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      action,
    }: {
      id: string;
      action: "accept" | "decline";
    }) => {
      const statusMap = {
        accept: INVITATION_STATUS.ACCEPTED,
        decline: INVITATION_STATUS.DECLINED,
      } as const;
      const result = await apiRequest<{ groupId?: string; group?: { id: string } }>(
        `/invitations/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: statusMap[action] }),
        },
      );
      if (result.message) {
        throw new ApiError({ message: result.message, code: result.code, status: result.status });
      }
      const groupId = result.data?.groupId ?? result.data?.group?.id;
      return { id, action, groupId };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.invitations.list() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.groups.myGroups });
    },
  });
}
