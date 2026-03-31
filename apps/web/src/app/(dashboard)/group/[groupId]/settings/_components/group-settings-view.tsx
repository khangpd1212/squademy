"use client";

import { GROUP_ROLES } from "@squademy/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGroup } from "@/hooks/api/use-group-queries";
import { useCurrentUser } from "@/hooks/api/use-auth-queries";
import { DeleteGroupSection } from "./delete-group-section";
import { GroupSettingsForm } from "./group-settings-form";

function normalizeTime(value: string | null) {
  if (!value) return null;
  return value.slice(0, 5);
}

export function GroupSettingsView({ groupId }: { groupId: string }) {
  const { data: group, isLoading: groupLoading } = useGroup(groupId);
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();

  if (groupLoading || userLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
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
      {isAdmin ? (
        <DeleteGroupSection groupId={groupId} groupName={group.name} />
      ) : null}
    </div>
  );
}
