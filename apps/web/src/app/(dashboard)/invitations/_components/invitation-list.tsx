"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useRespondInvitation } from "@/hooks/api/use-invitation-queries";
import type { InvitationType } from "@/hooks/api/use-invitation-queries";

type InvitationListProps = {
  invitations: InvitationType[];
};

export function InvitationList({ invitations: initial }: InvitationListProps) {
  const router = useRouter();
  const [invitations, setInvitations] = useState(initial);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const respondInvitationMutation = useRespondInvitation();

  async function handleAction(id: string, action: "accept" | "decline") {
    setProcessingId(id);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    try {
      const result = await respondInvitationMutation.mutateAsync({
        id,
        action,
      });
      if (action === "accept" && result.groupId) {
        router.push(`/group/${result.groupId}`);
        return;
      }

      // Decline — remove from list
      setInvitations((prev) => prev.filter((inv) => inv.id !== id));
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        [id]: err instanceof Error ? err.message : "Network error. Please try again.",
      }));
    } finally {
      setProcessingId(null);
    }
  }

  if (invitations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No pending invitations.</p>
    );
  }

  return (
    <ul className="divide-y">
      {invitations.map((inv) => (
        <li key={inv.id} className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium">{inv.groupName}</p>
            <p className="text-xs text-muted-foreground">
              Invited by {inv.invitedByName} &middot;{" "}
              {new Date(inv.createdAt).toLocaleDateString()}
            </p>
            {errors[inv.id] ? (
              <p className="text-xs text-destructive">{errors[inv.id]}</p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={processingId === inv.id}
              onClick={() => handleAction(inv.id, "accept")}
            >
              Accept
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={processingId === inv.id}
              onClick={() => handleAction(inv.id, "decline")}
            >
              Decline
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
