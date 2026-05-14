"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useInvitations } from "@/hooks/api/use-invitation-queries";
import { useDashboardFeed } from "@/hooks/api/use-dashboard-feed";
import { EmptyState } from "./empty-state";
import { PendingInvitations } from "./pending-invitations";
import { GroupMiniBar, GroupMiniBarSkeleton } from "./group-mini-bar";
import { FlashcardDecksSection } from "./flashcard-decks-section";
import { LessonFeedSection } from "./lesson-feed-section";

function DashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <GroupMiniBarSkeleton />
      <div className="space-y-4">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    </div>
  );
}

export function DashboardView() {
  const searchParams = useSearchParams();
  const { data: invitations, isLoading: invitationsLoading, error: invitationsError } = useInvitations();
  const { groups, groupsQuery, decks, lessons, isLoading, totalDecks, totalLessons } = useDashboardFeed();

  if (groupsQuery.isLoading || invitationsLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <DashboardSkeleton />
      </div>
    );
  }

  if (groupsQuery.error) {
    return (
      <div className="mx-auto w-full max-w-5xl rounded-lg border p-4">
        <p className="text-sm text-destructive">
          {groupsQuery.error instanceof Error ? groupsQuery.error.message : "Could not load dashboard data."}
        </p>
        <Button type="button" className="mt-3" onClick={() => void groupsQuery.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const hasInvitations = Boolean(invitations?.length);
  const hasGroups = Boolean(groups?.length);
  const showGroupDeletedMessage = searchParams.get("groupDeleted") === "1";

  if (!hasGroups && !hasInvitations) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <div className="space-y-1">
        <h1 className="text-(--dash-text) text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-(--dash-text-muted)">
          {groups.length} {groups.length === 1 ? "group" : "groups"}
          {totalDecks > 0 ? ` \u00b7 ${totalDecks} deck${totalDecks === 1 ? "" : "s"}` : ""}
          {totalLessons > 0 ? ` \u00b7 ${totalLessons} lesson${totalLessons === 1 ? "" : "s"}` : ""}
        </p>
      </div>

      {showGroupDeletedMessage ? (
        <div className="rounded-lg border border-(--dash-success)/30 bg-(--dash-success)/10 px-4 py-3 text-sm text-(--dash-success)">
          Group deleted.
        </div>
      ) : null}

      {invitationsError ? (
        <p className="text-sm text-destructive">Could not load invitations.</p>
      ) : hasInvitations ? (
        <PendingInvitations />
      ) : null}

      {hasGroups ? <GroupMiniBar groups={groups} /> : null}

      {hasGroups ? <FlashcardDecksSection decks={decks} isLoading={isLoading} /> : null}

      {hasGroups ? <LessonFeedSection lessons={lessons} isLoading={isLoading} /> : null}
    </div>
  );
}
