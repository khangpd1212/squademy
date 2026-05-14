"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import type { MyGroupItem } from "@/hooks/api/use-group-queries";

type GroupMiniBarProps = {
  groups: MyGroupItem[];
};

export function GroupMiniBar({ groups }: GroupMiniBarProps) {
  if (groups.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Users className="h-4 w-4 text-(--dash-text-muted)" />
      {groups.map((group) => (
        <Link
          key={group.id}
          href={`/groups/${group.id}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-(--dash-border-subtle) bg-(--dash-glass) px-3 py-1 text-xs font-medium text-(--dash-text-muted) transition-colors hover:border-(--dash-border) hover:text-(--dash-text)"
        >
          {group.name}
        </Link>
      ))}
    </div>
  );
}

export function GroupMiniBarSkeleton() {
  return (
    <div className="flex flex-wrap gap-2">
      <div className="h-6 w-16 animate-pulse rounded-full bg-(--dash-glass-active)" />
      <div className="h-6 w-20 animate-pulse rounded-full bg-(--dash-glass-active)" />
      <div className="h-6 w-14 animate-pulse rounded-full bg-(--dash-glass-active)" />
    </div>
  );
}
