import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const supabase = await createClient();

  const [{ data: groupData }, { count: memberCount }, { count: lessonCount }] =
    await Promise.all([
      supabase
        .from("groups")
        .select("id,name,description")
        .eq("id", groupId)
        .maybeSingle(),
      supabase
        .from("group_members")
        .select("group_id", { head: true, count: "exact" })
        .eq("group_id", groupId),
      supabase
        .from("lessons")
        .select("id", { head: true, count: "exact" })
        .eq("group_id", groupId),
    ]);

  const group = groupData as Pick<
    Database["public"]["Tables"]["groups"]["Row"],
    "id" | "name" | "description"
  > | null;

  if (!group) {
    notFound();
  }

  const hasNoPublishedContent = (lessonCount ?? 0) === 0;
  const showEmptyState = hasNoPublishedContent;

  return (
    <div className="space-y-4">
      {group.description ? (
        <p className="text-muted-foreground">{group.description}</p>
      ) : null}

      {showEmptyState ? (
        <Card className="sq-card">
          <CardHeader>
            <CardTitle>Your group is ready! Invite members to get started.</CardTitle>
            <CardDescription>
              Invite classmates now and start building your shared learning path.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Members: {memberCount ?? 0} {memberCount === 1 ? "member" : "members"}
            </p>
            <Link href={`/group/${groupId}/members`} className="sq-btn sq-btn-green">
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
