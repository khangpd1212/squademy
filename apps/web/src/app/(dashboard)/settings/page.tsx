import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { apiClient, getCurrentUser } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import { redirect } from "next/navigation";
import { ProfileForm } from "./_components/profile-form";

type UserProfile = {
  id: string;
  email: string;
  displayName: string;
  fullName: string | null;
  avatarUrl: string | null;
  school: string | null;
  location: string | null;
  age: number | null;
};

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: queryKeys.users.profile(),
    queryFn: async () => {
      const { data } = await apiClient<UserProfile>("/users/me");
      return data ?? null;
    },
  });
  const profile = queryClient.getQueryData<UserProfile | null>(queryKeys.users.profile());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
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
                displayName:
                  profile?.displayName ??
                  user.email?.split("@")[0] ??
                  "User",
                avatarUrl: profile?.avatarUrl ?? null,
                fullName: profile?.fullName ?? null,
                school: profile?.school ?? null,
                location: profile?.location ?? null,
                age: profile?.age ?? null,
              }}
            />
          </CardContent>
        </Card>
      </div>
    </HydrationBoundary>
  );
}
