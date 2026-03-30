"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card>
      <CardHeader>
        <CardTitle className="inline-flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Pending Invitations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {invitations.map((inv) => (
            <li key={inv.id} className="flex items-center justify-between gap-3 py-3">
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
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
