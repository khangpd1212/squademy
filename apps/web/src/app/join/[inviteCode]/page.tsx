import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api/client";
import { headers } from "next/headers";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ inviteCode: string }>;
}) {
  const { inviteCode } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/register?redirect=/join/${encodeURIComponent(inviteCode)}`);
  }

  // Delegate join logic to the API route
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") ?? "http";
  const origin = `${protocol}://${host}`;

  let response: Response;
  let payload: { ok?: boolean; data?: { id: string }; group?: { id: string }; message?: string };

  try {
    response = await fetch(`${origin}/api/groups/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: headersList.get("cookie") ?? "",
      },
      body: JSON.stringify({ inviteCode }),
    });
    const raw = await response.json();
    payload = raw as typeof payload;
  } catch {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-2xl font-bold">Could not join group</h1>
        <p className="text-muted-foreground">
          A network error occurred or the server could not be reached. Please
          try again later.
        </p>
        <Link href="/" className="text-primary underline">
          Back to home
        </Link>
      </div>
    );
  }

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

  const groupId = payload.data?.id ?? payload.group?.id;
  if (payload.ok && groupId) {
    redirect(`/group/${groupId}`);
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
