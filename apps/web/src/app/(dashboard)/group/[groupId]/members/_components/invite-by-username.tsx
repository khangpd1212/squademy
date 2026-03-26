"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateInvitation } from "@/hooks/api/use-invitation-queries";
import { useSearchUsers } from "@/hooks/api/use-user-queries";

type InviteByUsernameProps = {
  groupId: string;
};

export function InviteByUsername({ groupId }: InviteByUsernameProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const createInvitationMutation = useCreateInvitation();
  const searchQuery = useSearchUsers(debouncedQuery, groupId);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => {
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    if (searchQuery.error) {
      setError(searchQuery.error.message);
      return;
    }
    setError(null);
  }, [searchQuery.error]);

  async function handleSendInvite(inviteeId: string) {
    setSendingId(inviteeId);
    setError(null);

    try {
      await createInvitationMutation.mutateAsync({ groupId, inviteeId });
      setSentIds((prev) => new Set(prev).add(inviteeId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
    } finally {
      setSendingId(null);
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="invite-search">Invite by username</Label>
      <Input
        id="invite-search"
        placeholder="Search by display name..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {searchQuery.isFetching ? (
        <p className="text-xs text-muted-foreground">Searching...</p>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      {searchQuery.data && searchQuery.data.length > 0 ? (
        <ul className="rounded border divide-y">
          {searchQuery.data.map((profile) => (
            <li
              key={profile.id}
              className="flex items-center justify-between px-3 py-2"
            >
              <span className="text-sm">
                {profile.display_name ?? "Unknown"}
              </span>
              {sentIds.has(profile.id) ? (
                <span className="text-xs text-emerald-600 dark:text-emerald-400">
                  Invite sent!
                </span>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={sendingId === profile.id}
                  onClick={() => handleSendInvite(profile.id)}
                >
                  {sendingId === profile.id ? "Sending..." : "Send Invite"}
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {query.trim().length >= 2 &&
      !searchQuery.isFetching &&
      (searchQuery.data?.length ?? 0) === 0 ? (
        <p className="text-xs text-muted-foreground">No users found.</p>
      ) : null}
    </div>
  );
}
