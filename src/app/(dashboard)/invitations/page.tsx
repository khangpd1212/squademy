import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { InvitationList } from "./_components/invitation-list";

export type InvitationType = {
  id: string;
  group_id: string;
  group_name: string;
  invited_by_name: string;
  created_at: string;
};

export default async function InvitationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: rawInvitations } = await supabase
    .from("group_invitations")
    .select("id, group_id, invited_by, created_at")
    .eq("invitee_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const invitationRows = (rawInvitations ?? []) as Array<{
    id: string;
    group_id: string;
    invited_by: string;
    created_at: string;
  }>;
  const groupIds = [...new Set(invitationRows.map((i) => i.group_id))];
  const inviterIds = [...new Set(invitationRows.map((i) => i.invited_by))];

  const [{ data: groups }, { data: inviters }] = await Promise.all([
    groupIds.length > 0
      ? supabase.from("groups").select("id, name").in("id", groupIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    inviterIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", inviterIds)
      : Promise.resolve({
          data: [] as { id: string; display_name: string | null }[],
        }),
  ]);

  const groupMap = new Map(
    ((groups ?? []) as { id: string; name: string }[]).map((g) => [g.id, g.name])
  );
  const inviterMap = new Map(
    ((inviters ?? []) as { id: string; display_name: string | null }[]).map(
      (p) => [p.id, p.display_name]
    )
  );

  const invitations: InvitationType[] = invitationRows.map((inv) => ({
    id: inv.id,
    group_id: inv.group_id,
    group_name: groupMap.get(inv.group_id) ?? "Unknown group",
    invited_by_name: inviterMap.get(inv.invited_by) ?? "Someone",
    created_at: inv.created_at,
  }));

  return (
    <div className="max-w-3xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No pending invitations.
            </p>
          ) : (
            <InvitationList invitations={invitations} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
