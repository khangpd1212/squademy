"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInvitations, useRespondInvitation } from "@/hooks/api/use-invitation-queries";

export function PendingInvitations() {
  const router = useRouter();
  const { data: invitations } = useInvitations();
  const respondInvitationMutation = useRespondInvitation();
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
      const result = await respondInvitationMutation.mutateAsync({ id, action });
      if (action === "accept" && result.groupId) {
        router.push(`/group/${result.groupId}`);
        return;
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        [id]:
          error instanceof Error ? error.message : "Network error. Please try again.",
      }));
    } finally {
      setProcessingId(null);
    }
  }

  if (!invitations?.length) {
    return null;
  }

  return (
    <div className="rounded-(--dash-radius-lg) border border-(--dash-border-subtle) bg-(--dash-glass) backdrop-blur-xl">
      <div className="px-6 py-4">
        <h2 className="text-lg font-semibold inline-flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Pending Invitations
        </h2>
      </div>
      <div className="divide-y divide-(--dash-border-subtle)">
        {invitations.map((inv) => (
          <div key={inv.id} className="flex items-center justify-between gap-3 px-6 py-3 transition-colors hover:bg-(--dash-glass-hover)">
            <div>
              <p className="text-sm font-medium">{inv.groupName}</p>
              <p className="text-xs text-muted-foreground">
                Invited by {inv.invitedByName}
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
                variant="ghost"
                size="sm"
                disabled={processingId === inv.id}
                onClick={() => handleAction(inv.id, "decline")}
              >
                Decline
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
