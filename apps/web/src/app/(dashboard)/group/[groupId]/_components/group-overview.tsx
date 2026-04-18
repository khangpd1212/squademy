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
import { Empty } from "@/components/ui/empty";
import { useGroup } from "@/hooks/api/use-group-queries";
import { useGroupLearningPath } from "@/hooks/api/use-group-learning-path";
import { LearningPathCard } from "@/components/learning-path/learning-path-card";
import { GraduationCap } from "lucide-react";

export function GroupOverview({ groupId }: { groupId: string }) {
  const { data: group, isLoading } = useGroup(groupId);
  const { data: learningPathItems, isLoading: isLoadingPath } = useGroupLearningPath(groupId);

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

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Learning Path</h3>
        {isLoadingPath ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : !learningPathItems || learningPathItems.length === 0 ? (
          <Empty
            icon={GraduationCap}
            title="No lessons in this group's learning path yet"
          />
        ) : (
          <div className="space-y-2">
            {learningPathItems.map((item) => (
              <LearningPathCard key={item.id} item={item} groupId={groupId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
