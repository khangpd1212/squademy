"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DAY_NAMES } from "@squademy/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { useGroup } from "@/hooks/api/use-group-queries";

export function GroupOverview({ groupId }: { groupId: string }) {
  const { data: group, isLoading } = useGroup(groupId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!group) return null;

  const memberCount = group.members?.length ?? 0;
  const showEmptyState = memberCount <= 1;

  return (
    <div className="space-y-4">
      {group.description ? (
        <p className="text-muted-foreground">{group.description}</p>
      ) : null}

      {typeof group.exerciseDeadlineDay === "number" &&
      group.exerciseDeadlineTime ? (
        <p className="text-sm text-muted-foreground">
          Weekly exercise deadline: Every{" "}
          {DAY_NAMES[group.exerciseDeadlineDay]} at{" "}
          {group.exerciseDeadlineTime.slice(0, 5)}
        </p>
      ) : null}

      {showEmptyState ? (
        <Card className="sq-card">
          <CardHeader>
            <CardTitle>
              Your group is ready! Invite members to get started.
            </CardTitle>
            <CardDescription>
              Invite classmates now and start building your shared learning
              path.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Members: {memberCount}{" "}
              {memberCount === 1 ? "member" : "members"}
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
  );
}
