"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useInvitations } from "@/hooks/api/use-invitation-queries";
import { useMyGroups } from "@/hooks/api/use-group-queries";
import { EmptyState } from "./empty-state";
import { GroupCard } from "./group-card";
import { PendingInvitations } from "./pending-invitations";

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
      </div>
    </div>
  );
}

export function DashboardView() {
  const searchParams = useSearchParams();
  const {
    data: groups,
    isLoading: groupsLoading,
    error: groupsError,
    refetch: refetchGroups,
  } = useMyGroups();
  const {
    data: invitations,
    isLoading: invitationsLoading,
    error: invitationsError,
  } = useInvitations();

  if (groupsLoading || invitationsLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <DashboardSkeleton />
      </div>
    );
  }

  if (groupsError) {
    return (
      <div className="mx-auto w-full max-w-5xl rounded-lg border p-4">
        <p className="text-sm text-destructive">
          {groupsError instanceof Error ? groupsError.message : "Could not load dashboard data."}
        </p>
        <Button type="button" className="mt-3" onClick={() => void refetchGroups()}>
          Retry
        </Button>
      </div>
    );
  }

  const hasInvitations = Boolean(invitations?.length);
  const hasGroups = Boolean(groups?.length);
  const showGroupDeletedMessage = searchParams.get("groupDeleted") === "1";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">My Groups</h1>

      {showGroupDeletedMessage ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          Group deleted.
        </div>
      ) : null}

      {invitationsError ? (
        <p className="text-sm text-destructive">Could not load invitations.</p>
      ) : hasInvitations ? (
        <PendingInvitations />
      ) : null}

      {hasGroups ? (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups?.map((group) => <GroupCard key={group.id} group={group} />)}
        </section>
      ) : null}

      {!hasGroups && !hasInvitations ? <EmptyState /> : null}
    </div>
  );
}
