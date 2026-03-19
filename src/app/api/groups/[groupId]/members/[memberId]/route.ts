import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const SOLE_ADMIN_REMOVAL_MESSAGE =
  "You cannot remove yourself while you are the only admin. Transfer admin role first.";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ groupId: string; memberId: string }> }
) {
  const { groupId, memberId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { data: callerMembershipData } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();
  const callerMembership = callerMembershipData as { role: string } | null;

  if (!callerMembership || callerMembership.role !== "admin") {
    return NextResponse.json(
      { message: "Only group admins can remove members." },
      { status: 403 }
    );
  }

  const admin = createAdminClient();
  const { data: targetMembershipData, error: targetError } = await admin
    .from("group_members")
    .select("user_id, role")
    .eq("group_id", groupId)
    .eq("user_id", memberId)
    .maybeSingle();
  const targetMembership = targetMembershipData as
    | { user_id: string; role: string }
    | null;

  if (targetError) {
    return NextResponse.json({ message: "Could not load member." }, { status: 500 });
  }

  if (!targetMembership) {
    return NextResponse.json({ message: "Member not found." }, { status: 404 });
  }

  const isSelfRemoval = memberId === user.id && targetMembership.role === "admin";
  if (isSelfRemoval) {
    const { count, error: countError } = await admin
      .from("group_members")
      .select("user_id", { count: "exact", head: true })
      .eq("group_id", groupId)
      .eq("role", "admin");

    if (countError) {
      return NextResponse.json(
        { message: "Could not validate admin count." },
        { status: 500 }
      );
    }

    if ((count ?? 0) <= 1) {
      return NextResponse.json({ message: SOLE_ADMIN_REMOVAL_MESSAGE }, { status: 409 });
    }
  }

  const { error: deleteError } = await admin
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", memberId);

  if (deleteError) {
    return NextResponse.json({ message: "Could not remove member." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
