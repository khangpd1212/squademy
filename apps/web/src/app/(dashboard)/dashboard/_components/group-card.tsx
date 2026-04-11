"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { MyGroupItem } from "@/hooks/api/use-group-queries";
import { cn } from "@/lib/utils";
import { GROUP_ROLES, MemberRole } from "@squademy/shared";

function getRoleBadgeClass(role: MemberRole) {
  switch (role) {
    case GROUP_ROLES.ADMIN:
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
    case GROUP_ROLES.EDITOR:
      return "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300";
    default:
      return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
  }
}

function formatCreatedAt(createdAt: string) {
  const createdAtDate = new Date(createdAt);
  if (isNaN(createdAtDate.getTime())) {
    return "Created on unknown date";
  }
  const now = new Date();
  const diffMs = now.getTime() - createdAtDate.getTime();

  if (diffMs < 60_000) {
    return "Created just now";
  }

  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffMinutes < 60) {
    return `Created ${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `Created ${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return `Created ${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }

  return `Created ${createdAtDate.toLocaleDateString()}`;
}

type GroupCardProps = {
  group: MyGroupItem;
};

export function GroupCard({ group }: GroupCardProps) {
  return (
    <Link href={`/group/${group.id}`} className="block">
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold leading-tight">{group.name}</h3>
            <Badge className={cn("capitalize", getRoleBadgeClass(group.role))}>
              {group.role}
            </Badge>
          </div>

          {group.description ? (
            <p className="line-clamp-1 text-sm text-muted-foreground">{group.description}</p>
          ) : null}

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Users className="h-4 w-4" />
              {group.memberCount} member{group.memberCount === 1 ? "" : "s"}
            </span>
            <span>{formatCreatedAt(group.createdAt)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
