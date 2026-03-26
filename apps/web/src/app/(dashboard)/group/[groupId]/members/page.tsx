import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient, getCurrentUser } from "@/lib/api/client";
import { InviteLinkSection } from "./_components/invite-link-section";
import { InviteByUsername } from "./_components/invite-by-username";
import { MemberManagementList } from "./_components/member-management-list";

type GroupData = {
  id: string;
  name: string;
  inviteCode: string;
  members: Array<{
    userId: string;
    role: string;
    joinedAt: string;
    user: {
      displayName: string | null;
      avatarUrl: string | null;
    };
  }>;
};

export default async function GroupMembersPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { data: group } = await apiClient<GroupData>(`/groups/${groupId}`);

  if (!group) {
    redirect(`/group/${groupId}`);
  }

  const currentMember = group.members.find((m) => m.userId === user.userId);
  const isAdmin = currentMember?.role === "admin";

  // Transform members to the shape expected by MemberManagementList
  const members = group.members.map((m) => ({
    user_id: m.userId,
    role: m.role,
    joined_at: m.joinedAt,
    profiles: m.user
      ? {
          display_name: m.user.displayName,
          avatar_url: m.user.avatarUrl,
        }
      : null,
  }));

  return (
    <div className="space-y-6">
      {isAdmin && group.inviteCode ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invite Members</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InviteLinkSection
              inviteCode={group.inviteCode}
              groupId={groupId}
            />
            <InviteByUsername groupId={groupId} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Members ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MemberManagementList
            members={members}
            currentUserId={user.userId}
            isAdmin={isAdmin}
            groupId={groupId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
