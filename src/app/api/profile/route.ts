import { profileUpdateSchema, toNullableProfileValue } from "@/app/(dashboard)/settings/profile-schema";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { NextResponse } from "next/server";

type ProfileUpdatePayload = {
  displayName: string;
  fullName?: string | null;
  school?: string | null;
  location?: string | null;
  age?: number | null;
  avatarUrl?: string | null;
};

type ProfilesTableClient = {
  from: (table: "profiles") => {
    upsert: (
      values: Database["public"]["Tables"]["profiles"]["Insert"],
      options: { onConflict: string }
    ) => {
      eq: (column: "id", value: string) => {
        select: (columns: string) => {
          single: () => Promise<{
            data: Database["public"]["Tables"]["profiles"]["Row"] | null;
            error: { message?: string } | null;
          }>;
        };
      };
    };
  };
};

function normalizeAvatarUrl(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isSafeAvatarUrl(value: string | null) {
  if (!value) {
    return true;
  }

  return (
    value.startsWith("data:image/") ||
    value.startsWith("https://") ||
    value.startsWith("http://")
  );
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as ProfileUpdatePayload | null;
  const parsed = profileUpdateSchema.safeParse(body);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      {
        message: issue?.message ?? "Invalid profile input.",
        field: issue?.path?.[0],
      },
      { status: 400 }
    );
  }

  const normalizedAvatarUrl =
    typeof body?.avatarUrl === "undefined" ? undefined : normalizeAvatarUrl(body.avatarUrl);
  if (normalizedAvatarUrl !== undefined && !isSafeAvatarUrl(normalizedAvatarUrl)) {
    return NextResponse.json({ message: "Invalid avatar URL." }, { status: 400 });
  }

  const profileClient = supabase as unknown as ProfilesTableClient;
  const profilesTable = profileClient.from("profiles");
  const { data, error } = await profilesTable
    .upsert(
      {
        id: user.id,
      display_name: parsed.data.displayName.trim(),
      full_name: toNullableProfileValue(parsed.data.fullName),
      school: toNullableProfileValue(parsed.data.school),
      location: toNullableProfileValue(parsed.data.location),
      age: parsed.data.age ?? null,
      avatar_url: normalizedAvatarUrl,
      },
      { onConflict: "id" }
    )
    .eq("id", user.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ message: "Could not update profile." }, { status: 400 });
  }

  const profile = data as Database["public"]["Tables"]["profiles"]["Row"];

  return NextResponse.json({
    ok: true,
    profile: {
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
      fullName: profile.full_name,
      school: profile.school,
      location: profile.location,
      age: profile.age,
    },
  });
}
