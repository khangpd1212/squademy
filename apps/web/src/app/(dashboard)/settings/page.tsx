"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useProfile } from "@/hooks/api/use-user-queries";
import { ProfileForm } from "./_components/profile-form";

export default function SettingsPage() {
  const { data: profile, isLoading } = useProfile();

  const initialProfile = profile
    ? {
        ...profile,
        displayName: profile.displayName || profile.email.split("@")[0],
      }
    : undefined;

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
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading profile...</p>
          ) : initialProfile ? (
            <ProfileForm initialProfile={initialProfile} />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
