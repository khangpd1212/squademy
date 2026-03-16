import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { redirect } from "next/navigation";
import { ProfileForm } from "./_components/profile-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  const profile = data as Database["public"]["Tables"]["profiles"]["Row"] | null;

  return (
    <div className="max-w-3xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Profile settings</CardTitle>
          <CardDescription>Manage your public profile details and avatar.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            initialProfile={{
              displayName: profile?.display_name ?? user.email?.split("@")[0] ?? "User",
              avatarUrl: profile?.avatar_url ?? null,
              fullName: profile?.full_name ?? null,
              school: profile?.school ?? null,
              location: profile?.location ?? null,
              age: profile?.age ?? null,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
