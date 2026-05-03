"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateInvitation } from "@/hooks/api/use-invitation-queries";
import { useSearchUsers } from "@/hooks/api/use-user-queries";

type AddMemberDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
};

export function AddMemberDialog({
  open,
  onOpenChange,
  groupId,
}: AddMemberDialogProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
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

  const searchError = searchQuery.error?.message ?? null;
  const displayError = submitError ?? searchError;

  async function handleSendInvite(inviteeId: string) {
    setSendingId(inviteeId);
    setSubmitError(null);

    try {
      await createInvitationMutation.mutateAsync({ groupId, inviteeId });
      setSentIds((prev) => new Set(prev).add(inviteeId));
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Network error. Please try again.");
    } finally {
      setSendingId(null);
    }
  }

  function handleClose() {
    setQuery("");
    setDebouncedQuery("");
    setSentIds(new Set());
    setSendingId(null);
    setSubmitError(null);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Member</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-search">Invite by name or email</Label>
            <Input
              id="invite-search"
              placeholder="Search by name or email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {searchQuery.isFetching ? (
              <p className="text-xs text-muted-foreground">Searching...</p>
            ) : null}
            {displayError ? (
              <p className="text-xs text-destructive">{displayError}</p>
            ) : null}
          </div>

          <div className="max-h-64 overflow-y-auto rounded border">
            {searchQuery.data && searchQuery.data.length > 0 ? (
              <ul className="divide-y">
                {searchQuery.data.map((profile) => (
                  <li
                    key={profile.id}
                    className="flex items-center justify-between px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {profile.displayName ?? "Unknown"}
                      </p>
                      {profile.email ? (
                        <p className="truncate text-xs text-muted-foreground">
                          {profile.email}
                        </p>
                      ) : null}
                    </div>
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
            ) : query.trim().length >= 2 &&
              !searchQuery.isFetching &&
              (searchQuery.data?.length ?? 0) === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                No users found.
              </p>
            ) : null}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}