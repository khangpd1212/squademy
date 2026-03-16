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
    inviteCode?: string;
  } | null;

  if (!body?.inviteCode || typeof body.inviteCode !== "string") {
    return NextResponse.json(
      { message: "Invite code is required." },
      { status: 400 }
    );
  }

  const { data: groupData } = await supabase
    .from("groups")
    .select("id")
    .eq("invite_code", body.inviteCode)
    .maybeSingle();

  const group = groupData as { id: string } | null;

  if (!group) {
    return NextResponse.json(
      { message: "This invite link is invalid or has expired." },
      { status: 404 }
    );
  }

  const { data: existingMember } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("group_id", group.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingMember) {
    return NextResponse.json(
      { ok: true, group: { id: group.id } },
      { status: 200 }
    );
  }

  const admin = createAdminClient();
  const { error } = await admin.from("group_members").insert({
    group_id: group.id,
    user_id: user.id,
    role: "member",
  } as never);

  if (error) {
    return NextResponse.json(
      { message: "Could not join group." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { ok: true, group: { id: group.id } },
    { status: 201 }
  );
}
