import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api/client";
import { GroupLayoutShell } from "./_components/group-layout-shell";

export default async function GroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ groupId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { groupId } = await params;

  return <GroupLayoutShell groupId={groupId}>{children}</GroupLayoutShell>;
}
