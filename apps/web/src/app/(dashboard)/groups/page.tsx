import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api/client";
import { GroupsPageClient } from "./_components/groups-page-client";

export default async function GroupsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <GroupsPageClient />;
}
