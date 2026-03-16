import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    action?: string;
  } | null;

  if (!body?.action || (body.action !== "accept" && body.action !== "decline")) {
    return NextResponse.json(
      { message: "Action must be 'accept' or 'decline'." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { data: invitationData } = await admin
    .from("group_invitations")
    .select("id, group_id, invitee_id, status")
    .eq("id", id)
    .maybeSingle();

  const invitation = invitationData as {
    id: string;
    group_id: string;
    invitee_id: string;
    status: string;
  } | null;

  if (!invitation) {
    return NextResponse.json(
      { message: "Invitation not found." },
      { status: 404 }
    );
  }

  if (invitation.invitee_id !== user.id) {
    return NextResponse.json(
      { message: "You are not the invitee." },
      { status: 403 }
    );
  }

  if (invitation.status !== "pending") {
    return NextResponse.json(
      { message: "This invitation has already been processed." },
      { status: 409 }
    );
  }

  if (body.action === "accept") {
    // Check not already member (idempotency)
    const { data: existingMember } = await admin
      .from("group_members")
      .select("group_id")
      .eq("group_id", invitation.group_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existingMember) {
      const { error: insertError } = await admin
        .from("group_members")
        .insert({
          group_id: invitation.group_id,
          user_id: user.id,
          role: "member",
        } as never);

      if (insertError) {
        return NextResponse.json(
          { message: "Could not join group." },
          { status: 500 }
        );
      }
    }

    const { error: acceptError } = await admin
      .from("group_invitations")
      .update({ status: "accepted" } as never)
      .eq("id", id);

    if (acceptError) {
      return NextResponse.json(
        { message: "Could not update invitation status." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { ok: true, groupId: invitation.group_id },
      { status: 200 }
    );
  }

  // decline
  const { error: declineError } = await admin
    .from("group_invitations")
    .update({ status: "declined" } as never)
    .eq("id", id);

  if (declineError) {
    return NextResponse.json(
      { message: "Could not update invitation status." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
