import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api/client";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  redirect("/login");
}
