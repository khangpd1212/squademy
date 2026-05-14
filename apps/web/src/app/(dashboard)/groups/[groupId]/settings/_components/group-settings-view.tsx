"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GROUP_ROLES } from "@squademy/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGroup } from "@/hooks/api/use-group-queries";
import { useCurrentUser } from "@/hooks/api/use-auth-queries";
import { useGroupMembers } from "@/hooks/api/use-member-queries";
import { DeleteGroupSection } from "./delete-group-section";
import { GroupSettingsForm } from "./group-settings-form";
import { AddMemberDialog } from "./add-member-dialog";
import { InviteLinkSection } from "./invite-link-section";
import { MemberManagementList } from "./member-management-list";

function normalizeTime(value: string | null) {
  if (!value) return null;
  return value.slice(0, 5);
}

export function GroupSettingsView({ groupId }: { groupId: string }) {
  const { data: group, isLoading: groupLoading } = useGroup(groupId);
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: members = [], isLoading: membersLoading } = useGroupMembers(groupId);
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  if (groupLoading || userLoading || membersLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!group || !currentUser) return null;

  const currentMember = group.members?.find(
    (m) => m.userId === currentUser.userId,
  );
  const isAdmin = currentMember?.role === GROUP_ROLES.ADMIN;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Group Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <GroupSettingsForm
            groupId={groupId}
            initialValues={{
              name: group.name,
              description: group.description,
              exerciseDeadlineDay: group.exerciseDeadlineDay,
              exerciseDeadlineTime: normalizeTime(group.exerciseDeadlineTime),
            }}
            isAdmin={isAdmin}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Members ({members.length})
            </CardTitle>
            {isAdmin && (
              <Button size="sm" onClick={() => setAddMemberOpen(true)}>
                Add Member
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAdmin && group.inviteCode && (
            <div className="pb-4 border-b">
              <InviteLinkSection
                inviteCode={group.inviteCode}
                groupId={groupId}
              />
            </div>
          )} 
          <MemberManagementList
            members={members}
            currentUserId={currentUser.userId}
            isAdmin={isAdmin}
            groupId={groupId}
          />
        </CardContent>
      </Card>

      {isAdmin ? (
        <DeleteGroupSection groupId={groupId} groupName={group.name} />
      ) : null}

      <AddMemberDialog
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
        groupId={groupId}
      />
    </div>
  );
}