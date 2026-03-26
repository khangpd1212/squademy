"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useInvitations } from "@/hooks/api/use-invitation-queries";
import { InvitationList } from "./invitation-list";

export function InvitationsView() {
  const { data: invitations, isLoading } = useInvitations();

  if (isLoading) {
    return (
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          {!invitations || invitations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No pending invitations.
            </p>
          ) : (
            <InvitationList invitations={invitations} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
