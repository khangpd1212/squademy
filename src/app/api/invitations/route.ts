import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    groupId?: string;
    inviteeId?: string;
  } | null;

  if (!body?.groupId || !body?.inviteeId) {
    return NextResponse.json(
      { message: "groupId and inviteeId are required." },
      { status: 400 }
    );
  }

  // Verify caller is admin
  const { data: membershipData } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", body.groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  const membership = membershipData as { role: string } | null;

  if (!membership || membership.role !== "admin") {
    return NextResponse.json(
      { message: "Only group admins can send invitations." },
      { status: 403 }
    );
  }

  // Check invitee is not already a member
  const { data: existingMember } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("group_id", body.groupId)
    .eq("user_id", body.inviteeId)
    .maybeSingle();

  if (existingMember) {
    return NextResponse.json(
      { message: "User is already a member of this group." },
      { status: 409 }
    );
  }

  // Check no existing pending invitation
  const admin = createAdminClient();
  const { data: existingInvite } = await admin
    .from("group_invitations")
    .select("id")
    .eq("group_id", body.groupId)
    .eq("invitee_id", body.inviteeId)
    .eq("status", "pending")
    .maybeSingle();

  if (existingInvite) {
    return NextResponse.json(
      { message: "An invitation is already pending for this user." },
      { status: 409 }
    );
  }

  const { data: invitationData, error } = await admin
    .from("group_invitations")
    .insert({
      group_id: body.groupId,
      invited_by: user.id,
      invitee_id: body.inviteeId,
    } as never)
    .select("id")
    .single();

  const invitation = invitationData as { id: string } | null;

  if (error || !invitation) {
    return NextResponse.json(
      { message: "Could not create invitation." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { ok: true, invitation: { id: invitation.id } },
    { status: 201 }
  );
}
