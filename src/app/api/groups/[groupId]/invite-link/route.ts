import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

let inviteCodeGenerator: (() => string) | null = null;

async function getInviteCodeGenerator() {
  if (inviteCodeGenerator) {
    return inviteCodeGenerator;
  }
  const { customAlphabet } = await import("nanoid");
  inviteCodeGenerator = customAlphabet(
    "0123456789abcdefghijklmnopqrstuvwxyz",
    12
  );
  return inviteCodeGenerator;
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { data: membershipData } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  const membership = membershipData as { role: string } | null;

  if (!membership || membership.role !== "admin") {
    return NextResponse.json(
      { message: "Only group admins can revoke the invite link." },
      { status: 403 }
    );
  }

  const generateInviteCode = await getInviteCodeGenerator();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const newCode = generateInviteCode();
    const { error } = await supabase
      .from("groups")
      .update({ invite_code: newCode } as never)
      .eq("id", groupId);

    if (error) {
      if (
        error.code === "23505" &&
        /invite_code/i.test(error.message ?? "")
      ) {
        if (attempt < 2) continue;
      }
      return NextResponse.json(
        { message: "Could not regenerate invite link." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { ok: true, inviteCode: newCode },
      { status: 200 }
    );
  }

  return NextResponse.json(
    { message: "Could not regenerate invite link." },
    { status: 500 }
  );
}
