import { redirect } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { InviteLinkSection } from "./_components/invite-link-section";
import { InviteByUsername } from "./_components/invite-by-username";

export default async function GroupMembersPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [membershipResult, groupResult, membersResult] = await Promise.all([
    supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("groups")
      .select("id,name,invite_code")
      .eq("id", groupId)
      .maybeSingle(),
    supabase
      .from("group_members")
      .select("user_id, role, joined_at, profiles(display_name, avatar_url)")
      .eq("group_id", groupId)
      .order("joined_at", { ascending: true }),
  ]);

  const membership = membershipResult.data as { role: string } | null;
  const group = groupResult.data as {
    id: string;
    name: string;
    invite_code: string;
  } | null;
  const members = (membersResult.data ?? []) as Array<{
    user_id: string;
    role: string;
    joined_at: string;
    profiles: { display_name: string | null; avatar_url: string | null } | null;
  }>;

  const isAdmin = membership?.role === "admin";

  return (
    <div className="space-y-6">
      {isAdmin && group?.invite_code ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invite Members</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InviteLinkSection
              inviteCode={group.invite_code}
              groupId={groupId}
            />
            <InviteByUsername groupId={groupId} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Members ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {members.map((member) => {
              const profile = member.profiles;
              const displayName = profile?.display_name ?? "Unknown";
              const initials = displayName.slice(0, 2).toUpperCase();

              return (
                <li
                  key={member.user_id}
                  className="flex items-center gap-3 py-3"
                >
                  <Avatar>
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      Joined{" "}
                      {new Date(member.joined_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {member.role}
                  </Badge>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
