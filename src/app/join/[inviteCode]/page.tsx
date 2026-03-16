import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ inviteCode: string }>;
}) {
  const { inviteCode } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/register?redirect=/join/${encodeURIComponent(inviteCode)}`);
  }

  // Delegate join logic to the API route (avoids side-effect mutations in GET render)
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") ?? "http";
  const origin = `${protocol}://${host}`;

  const response = await fetch(`${origin}/api/groups/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: headersList.get("cookie") ?? "",
    },
    body: JSON.stringify({ inviteCode }),
  });

  const payload = (await response.json()) as {
    ok?: boolean;
    group?: { id: string };
    message?: string;
  };

  if (response.status === 404) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-2xl font-bold">Invalid invite link</h1>
        <p className="text-muted-foreground">
          This invite link is invalid or has expired.
        </p>
        <Link href="/" className="text-primary underline">
          Back to home
        </Link>
      </div>
    );
  }

  if (payload.ok && payload.group?.id) {
    redirect(`/group/${payload.group.id}`);
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-bold">Could not join group</h1>
      <p className="text-muted-foreground">
        {payload.message ?? "Something went wrong. Please try again later."}
      </p>
      <Link href="/" className="text-primary underline">
        Back to home
      </Link>
    </div>
  );
}
