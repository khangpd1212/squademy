"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useGenerateInviteLink } from "@/hooks/api/use-group-queries";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type InviteLinkSectionProps = {
  inviteCode: string;
  groupId: string;
};

export function InviteLinkSection({
  inviteCode: initialCode,
  groupId,
}: InviteLinkSectionProps) {
  const [inviteCode, setInviteCode] = useState(initialCode);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generateInviteLinkMutation = useGenerateInviteLink(groupId);

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join/${inviteCode}`
      : `/join/${inviteCode}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(`Could not copy link. Please copy manually: ${inviteUrl}`);
    }
  }

  async function handleRevoke() {
    setError(null);

    try {
      const newCode = await generateInviteLinkMutation.mutateAsync();
      setInviteCode(newCode);
      setRevokeOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
    }
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Invite Link</h3>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded bg-muted px-2 py-1 text-xs">
          {inviteUrl}
        </code>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? "Link copied!" : "Copy Invite Link"}
        </Button>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive"
        onClick={() => setRevokeOpen(true)}
      >
        Revoke Invite Link
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      <Dialog open={revokeOpen} onOpenChange={setRevokeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke invite link?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            The current link will stop working immediately. A new invite code
            will be generated.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRevokeOpen(false)}
              disabled={generateInviteLinkMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevoke}
              disabled={generateInviteLinkMutation.isPending}
            >
              {generateInviteLinkMutation.isPending ? "Revoking..." : "Revoke"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
