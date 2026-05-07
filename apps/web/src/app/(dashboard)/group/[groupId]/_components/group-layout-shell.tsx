"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useGroup } from "@/hooks/api/use-group-queries";
import { useGroupMemberRole } from "@/hooks/api/use-member-queries";
import { GROUP_ROLES } from "@squademy/shared";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Overview", suffix: "" },
  { label: "Lessons", suffix: "/lessons" },
  { label: "Flashcards", suffix: "/flashcards" },
  { label: "Exercises", suffix: "/exercises" },
  { label: "Roadmap", suffix: "/roadmap", editorOnly: true },
  { label: "Leaderboard", suffix: "/leaderboard" },
  { label: "Settings", suffix: "/settings" },
];

export function GroupLayoutShell({
  groupId,
  children,
}: {
  groupId: string;
  children: React.ReactNode;
}) {
  const { data: group, isLoading, isError } = useGroup(groupId);
  const { data: myRole } = useGroupMemberRole(groupId);
  const pathname = usePathname();

  const isEditorOrAdmin = myRole === GROUP_ROLES.ADMIN || myRole === GROUP_ROLES.EDITOR;
  const visibleTabs = tabs.filter((tab) => !tab.editorOnly || isEditorOrAdmin);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !group) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Group not found</h1>
        <p className="text-muted-foreground">
          This group doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <Link href="/" className="sq-btn sq-btn-green inline-block">
          Back to home
        </Link>
      </div>
    );
  }

  const basePath = `/group/${groupId}`;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{group.name}</h1>
        <p className="text-sm text-muted-foreground">Group workspace</p>
      </div>
      <nav className="flex gap-2 overflow-x-auto clay-surface p-2 rounded-clay">
        {visibleTabs.map((tab) => {
          const href = `${basePath}${tab.suffix}`;
          const isActive =
            tab.suffix === ""
              ? pathname === basePath
              : pathname.startsWith(href);
          return (
            <Link
              key={tab.suffix}
              href={href}
              className={cn(
                "clay-btn px-3 py-1.5 text-sm font-medium",
                isActive && "bg-(clay-surface-elevated) shadow-(shadow-clay-inner) text-zinc-900 dark:text-zinc-100",
                !isActive && "hover:bg-(clay-surface-2)"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
