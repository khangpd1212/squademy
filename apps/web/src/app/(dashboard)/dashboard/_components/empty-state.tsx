"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useJoinGroup } from "@/hooks/api/use-group-queries";

function extractInviteCode(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/join\/([a-z0-9]+)/i);
  return match ? match[1] : trimmed;
}

export function EmptyState() {
  const router = useRouter();
  const joinGroupMutation = useJoinGroup();
  const [inviteInput, setInviteInput] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleJoin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    const inviteCode = extractInviteCode(inviteInput);
    if (!inviteCode) {
      setSubmitError("Please enter an invite link or code.");
      return;
    }

    try {
      const groupId = await joinGroupMutation.mutateAsync(inviteCode);
      router.push(`/group/${groupId}`);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Could not join group. Please try again.",
      );
    }
  }

  return (
    <div className="rounded-xl border border-dashed p-8 text-center">
      <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Users className="h-7 w-7 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold">You&apos;re not part of any group yet.</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Create a group or join with an invite link to get started.
      </p>

      <div className="mt-6 flex flex-col items-center gap-3">
        <Button render={<Link href="/groups/create" />}>
          Create a Group
        </Button>

        <form onSubmit={handleJoin} className="flex w-full max-w-md items-center gap-2">
          <Input
            value={inviteInput}
            onChange={(event) => setInviteInput(event.target.value)}
            placeholder="Paste invite link or code"
            aria-label="Join with Invite Link"
          />
          <Button type="submit" variant="outline" disabled={joinGroupMutation.isPending}>
            <UserPlus className="h-4 w-4" />
            Join
          </Button>
        </form>
      </div>

      {submitError ? <p className="mt-3 text-sm text-destructive">{submitError}</p> : null}
    </div>
  );
}
