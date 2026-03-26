import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/api/client";
import { redirect } from "next/navigation";
import { ProfileForm } from "./_components/profile-form";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="max-w-3xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Profile settings</CardTitle>
          <CardDescription>
            Manage your public profile details and avatar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            initialProfile={{
              displayName: user.email?.split("@")[0] ?? "User",
              avatarUrl: null,
              fullName: null,
              school: null,
              location: null,
              age: null,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
