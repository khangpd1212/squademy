import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const groupId = url.searchParams.get("groupId") ?? "";

  if (q.length < 2) {
    return NextResponse.json(
      { message: "Search query must be at least 2 characters." },
      { status: 400 }
    );
  }

  if (!groupId) {
    return NextResponse.json(
      { message: "groupId is required." },
      { status: 400 }
    );
  }

  // Verify requester is admin of the group
  const { data: membershipData } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  const membership = membershipData as { role: string } | null;

  if (!membership || membership.role !== "admin") {
    return NextResponse.json(
      { message: "Only group admins can search for members to invite." },
      { status: 403 }
    );
  }

  // Get existing member IDs so we can exclude them
  const { data: existingMembers } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId);

  const memberRows = (existingMembers ?? []) as Array<{ user_id: string }>;
  const excludeIds = [user.id, ...memberRows.map((m) => m.user_id)];

  const excludeList = `(${excludeIds.join(",")})`;

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .ilike("display_name", `%${q}%`)
    .not("id", "in", excludeList)
    .limit(10);

  if (error) {
    return NextResponse.json(
      { message: "Search failed." },
      { status: 500 }
    );
  }

  return NextResponse.json({ profiles: profiles ?? [] });
}
