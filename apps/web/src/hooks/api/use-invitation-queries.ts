"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/browser-client";
import { queryKeys } from "@/lib/api/query-keys";

export type InvitationType = {
  id: string;
  group_id: string;
  group_name: string;
  invited_by_name: string;
  created_at: string;
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
      if (result.error) {
        throw new Error(result.error);
      }
      return (result.data ?? []).map((inv) => ({
        id: inv.id,
        group_id: inv.groupId ?? inv.group?.id ?? "",
        group_name: inv.group?.name ?? "Unknown group",
        invited_by_name: inv.inviter?.displayName ?? "Someone",
        created_at: inv.createdAt,
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
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.invitations.list() });
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
      const result = await apiRequest<{ groupId?: string }>(`/invitations/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      if (result.error) {
        throw new Error(result.error);
      }
      return { id, action, groupId: result.data?.groupId };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.invitations.list() });
    },
  });
}
