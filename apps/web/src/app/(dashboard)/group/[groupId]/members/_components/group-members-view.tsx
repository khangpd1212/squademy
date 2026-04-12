"use client";

import { GROUP_ROLES } from "@squademy/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGroup } from "@/hooks/api/use-group-queries";
import { useCurrentUser } from "@/hooks/api/use-auth-queries";
import { useGroupMembers } from "@/hooks/api/use-member-queries";
import { InviteLinkSection } from "./invite-link-section";
import { InviteByUsername } from "./invite-by-username";
import { MemberManagementList } from "./member-management-list";

export function GroupMembersView({ groupId }: { groupId: string }) {
  const { data: group, isLoading: groupLoading } = useGroup(groupId);
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: members = [], isLoading: membersLoading } = useGroupMembers(groupId);

  if (groupLoading || userLoading || membersLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!group || !currentUser) return null;

  const currentMember = members.find(
    (m) => m.userId === currentUser.userId,
  );
  const isAdmin = currentMember?.role === GROUP_ROLES.ADMIN;

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
            currentUserId={currentUser.userId}
            isAdmin={isAdmin}
            groupId={groupId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
