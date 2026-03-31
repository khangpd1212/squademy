import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api/client";
import { DashboardView } from "./_components/dashboard-view";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  return <DashboardView />;
}
