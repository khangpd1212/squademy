import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api/client";
import { InvitationsView } from "./_components/invitations-view";

export default async function InvitationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <InvitationsView />;
}
