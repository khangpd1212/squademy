import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient, getCurrentUser } from "@/lib/api/client";
import { InvitationList } from "./_components/invitation-list";

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
  inviteeId: string;
  status: string;
  createdAt: string;
  group: { id: string; name: string };
  inviter: { id: string; displayName: string | null };
};

export default async function InvitationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { data: rawInvitations } =
    await apiClient<InvitationData[]>("/invitations");

  const invitations: InvitationType[] = (rawInvitations ?? []).map((inv) => ({
    id: inv.id,
    group_id: inv.groupId ?? inv.group?.id ?? "",
    group_name: inv.group?.name ?? "Unknown group",
    invited_by_name: inv.inviter?.displayName ?? "Someone",
    created_at: inv.createdAt,
  }));

  return (
    <div className="max-w-3xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No pending invitations.
            </p>
          ) : (
            <InvitationList invitations={invitations} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
