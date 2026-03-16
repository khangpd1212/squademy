"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { InvitationType } from "../page";

type InvitationListProps = {
  invitations: InvitationType[];
};

export function InvitationList({ invitations: initial }: InvitationListProps) {
  const router = useRouter();
  const [invitations, setInvitations] = useState(initial);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleAction(id: string, action: "accept" | "decline") {
    setProcessingId(id);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    try {
      const response = await fetch(`/api/invitations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        groupId?: string;
        message?: string;
      };

      if (!response.ok) {
        setErrors((prev) => ({
          ...prev,
          [id]: payload.message ?? "Action failed.",
        }));
        return;
      }

      if (action === "accept" && payload.groupId) {
        router.push(`/group/${payload.groupId}`);
        return;
      }

      // Decline — remove from list
      setInvitations((prev) => prev.filter((inv) => inv.id !== id));
    } catch {
      setErrors((prev) => ({
        ...prev,
        [id]: "Network error. Please try again.",
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
            <p className="text-sm font-medium">{inv.group_name}</p>
            <p className="text-xs text-muted-foreground">
              Invited by {inv.invited_by_name} &middot;{" "}
              {new Date(inv.created_at).toLocaleDateString()}
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
