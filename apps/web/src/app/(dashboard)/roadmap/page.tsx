"use client";

import Link from "next/link";
import { useMyGroups } from "@/hooks/api/use-group-queries";
import { Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function RoadmapStudioPage() {
  const { data: groups, isLoading } = useMyGroups();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Learning Paths</h1>
        <p className="text-muted-foreground">
          You&apos;re not a member of any group yet.
        </p>
        <Link href="/groups/create" className="sq-btn sq-btn-green">
          Create your first group
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Learning Paths</h1>
      <p className="text-muted-foreground">
        Choose a group to manage its learning path
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <Link
            key={group.id}
            href={`/group/${group.id}/roadmap`}
            className="flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
          >
            <div className="flex shrink-0 items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{group.name}</p>
              <p className="text-sm text-muted-foreground">
                {group.memberCount === 1
                  ? "1 member"
                  : `${group.memberCount} members`}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}