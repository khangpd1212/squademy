import { notFound, redirect } from "next/navigation";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient, getCurrentUser } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import { GroupSettingsForm } from "./_components/group-settings-form";

type GroupData = {
  id: string;
  name: string;
  description: string | null;
  exerciseDeadlineDay: number | null;
  exerciseDeadlineTime: string | null;
  members: Array<{ userId: string; role: string }>;
};

function normalizeTime(value: string | null) {
  if (!value) return null;
  return value.slice(0, 5);
}

export default async function GroupSettingsPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: queryKeys.groups.detail(groupId),
    queryFn: async () => {
      const { data } = await apiClient<GroupData>(`/groups/${groupId}`);
      return data ?? null;
    },
  });
  const group = queryClient.getQueryData<GroupData | null>(queryKeys.groups.detail(groupId));

  if (!group) {
    notFound();
  }

  const currentMember = group.members?.find((m) => m.userId === user.userId);
  const callerRole = currentMember?.role ?? "member";

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
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
                description: group.description ?? "",
                exercise_deadline_day: group.exerciseDeadlineDay,
                exercise_deadline_time: normalizeTime(
                  group.exerciseDeadlineTime,
                ),
              }}
              isAdmin={callerRole === "admin"}
            />
          </CardContent>
        </Card>

        {/* Delete Group section - Story 2.5 */}
      </div>
    </HydrationBoundary>
  );
}
