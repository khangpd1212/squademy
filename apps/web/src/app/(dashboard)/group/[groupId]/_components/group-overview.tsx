"use client";

import Link from "next/link";
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
        <div className="rounded-(--dash-radius-lg) border border-(--dash-border-subtle) bg-(--dash-glass) backdrop-blur-xl">
          <div className="px-6 py-4">
            <h2 className="text-lg font-semibold">
              Your group is ready! Invite members to get started.
            </h2>
            <p className="text-sm text-muted-foreground">
              Invite classmates now and start building your shared learning
              path.
            </p>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-(--dash-border-subtle) bg-(--dash-glass) px-6 py-4 rounded-b-(--dash-radius-lg)">
            <p className="text-sm text-muted-foreground">
              Members: {memberCount}{" "}
              {memberCount === 1 ? "member" : "members"}
            </p>
            <Link
              href={`/group/${groupId}/members`}
              className="inline-flex h-8 items-center justify-center rounded-(--dash-radius) bg-(--dash-primary) px-3 text-sm font-medium text-white hover:bg-(--dash-primary-hover)"
            >
              Invite Members
            </Link>
          </div>
        </div>
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
