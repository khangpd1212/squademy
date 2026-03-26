import Link from "next/link";
import { notFound } from "next/navigation";
import { apiClient } from "@/lib/api/client";

type GroupData = {
  id: string;
  name: string;
};

export default async function GroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;

  const { data: group } = await apiClient<GroupData>(`/groups/${groupId}`);

  if (!group) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{group.name}</h1>
        <p className="text-sm text-muted-foreground">Group workspace</p>
      </div>
      <nav className="flex gap-2 overflow-x-auto border-b pb-2">
        <Link
          href={`/group/${groupId}`}
          className="rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent"
        >
          Overview
        </Link>
        <Link
          href={`/group/${groupId}/lessons`}
          className="rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent"
        >
          Lessons
        </Link>
        <Link
          href={`/group/${groupId}/exercises`}
          className="rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent"
        >
          Exercises
        </Link>
        <Link
          href={`/group/${groupId}/leaderboard`}
          className="rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent"
        >
          Leaderboard
        </Link>
        <Link
          href={`/group/${groupId}/members`}
          className="rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent"
        >
          Members
        </Link>
        <Link
          href={`/group/${groupId}/settings`}
          className="rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent"
        >
          Settings
        </Link>
      </nav>
      {children}
    </div>
  );
}
