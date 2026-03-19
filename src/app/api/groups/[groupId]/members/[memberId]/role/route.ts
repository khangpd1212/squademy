import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { memberRoleSchema, type MemberRoleInput } from "../member-role-schema";

const SOLE_ADMIN_DEMOTION_MESSAGE =
  "You cannot remove admin role from yourself while you are the only admin.";

export async function PATCH(
  request: Request,
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

  const body = (await request.json().catch(() => null)) as MemberRoleInput | null;
  const parsed = memberRoleSchema.safeParse(body);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      {
        message: issue?.message ?? "Invalid role input.",
        field: issue?.path?.[0],
      },
      { status: 400 }
    );
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
      { message: "Only group admins can manage member roles." },
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

  const isSelfDemotion =
    memberId === user.id &&
    targetMembership.role === "admin" &&
    parsed.data.role !== "admin";

  if (isSelfDemotion) {
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
      return NextResponse.json(
        { message: SOLE_ADMIN_DEMOTION_MESSAGE },
        { status: 409 }
      );
    }
  }

  const { error: updateError } = await admin
    .from("group_members")
    .update({ role: parsed.data.role } as never)
    .eq("group_id", groupId)
    .eq("user_id", memberId);

  if (updateError) {
    return NextResponse.json({ message: "Could not update member role." }, { status: 500 });
  }

  return NextResponse.json(
    {
      ok: true,
      member: {
        userId: memberId,
        role: parsed.data.role,
      },
    },
    { status: 200 }
  );
}
