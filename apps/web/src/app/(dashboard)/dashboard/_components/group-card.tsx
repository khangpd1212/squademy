"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import type { MyGroupItem } from "@/hooks/api/use-group-queries";
import { cn } from "@/lib/utils";
import { GROUP_ROLES, MemberRole } from "@squademy/shared";

function getRoleBadgeClass(role: MemberRole) {
  switch (role) {
    case GROUP_ROLES.ADMIN:
      return "bg-(--dash-primary)/15 text-(--dash-primary)";
    case GROUP_ROLES.EDITOR:
      return "bg-(--dash-success)/15 text-(--dash-success)";
    default:
      return "bg-(--dash-surface-elevated) text-(--dash-text-muted)";
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
    <Link href={`/groups/${group.id}`} className="block">
      <div className="h-full rounded-(--dash-radius-lg) border border-(--dash-border-subtle) bg-(--dash-glass) backdrop-blur-xl transition-shadow hover:shadow-(--dash-shadow-md)">
        <div className="space-y-3 p-6">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold leading-tight">{group.name}</h3>
            <span className={cn("inline-flex shrink-0 items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", getRoleBadgeClass(group.role))}>
              {group.role}
            </span>
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
        </div>
      </div>
    </Link>
  );
}
