import Link from "next/link";
import { notFound } from "next/navigation";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiClient } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";

type GroupDetail = {
  id: string;
  name: string;
  description: string | null;
  exerciseDeadlineDay: number | null;
  exerciseDeadlineTime: string | null;
  members: Array<{ userId: string }>;
  lessons?: Array<{ id: string }>;
};

export default async function GroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: queryKeys.groups.detail(groupId),
    queryFn: async () => {
      const { data } = await apiClient<GroupDetail>(`/groups/${groupId}`);
      return data ?? null;
    },
  });
  const group = queryClient.getQueryData<GroupDetail | null>(queryKeys.groups.detail(groupId));

  if (!group) {
    notFound();
  }

  const memberCount = group.members?.length ?? 0;
  const lessonCount = group.lessons?.length ?? 0;
  const showEmptyState = lessonCount === 0;

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="space-y-4">
        {group.description ? (
          <p className="text-muted-foreground">{group.description}</p>
        ) : null}

        {typeof group.exerciseDeadlineDay === "number" &&
        group.exerciseDeadlineTime ? (
          <p className="text-sm text-muted-foreground">
            Weekly exercise deadline: Every{" "}
            {
              [
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
              ][group.exerciseDeadlineDay]
            }{" "}
            at {group.exerciseDeadlineTime.slice(0, 5)}
          </p>
        ) : null}

        {showEmptyState ? (
          <Card className="sq-card">
            <CardHeader>
              <CardTitle>
                Your group is ready! Invite members to get started.
              </CardTitle>
              <CardDescription>
                Invite classmates now and start building your shared learning path.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Members: {memberCount} {memberCount === 1 ? "member" : "members"}
              </p>
              <Link
                href={`/group/${groupId}/members`}
                className="sq-btn sq-btn-green"
              >
                Invite Members
              </Link>
            </CardContent>
          </Card>
        ) : null}

        {!showEmptyState ? (
          <p className="text-sm text-muted-foreground">
            Group activity will appear here as members start contributing.
          </p>
        ) : null}
      </div>
    </HydrationBoundary>
  );
}
