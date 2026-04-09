"use client";

import { use } from "react";
import { useGroupFlashcardDecks } from "@/hooks/api/use-flashcard-queries";
import { Skeleton } from "@/components/ui/skeleton";
import { FlashcardDeckCard } from "./_components/flashcard-deck-card";

type PageProps = {
  params: Promise<{ groupId: string }>;
};

export default function GroupFlashcardsPage({ params }: PageProps) {
  const { groupId } = use(params);
  const { data: decks, isLoading } = useGroupFlashcardDecks(groupId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Flashcards</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!decks || decks.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Flashcards</h2>
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="mt-2 text-muted-foreground">No flashcards yet. Check back later!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Flashcards</h2>
      <div className="grid gap-3">
        {decks.map((deck) => (
          <FlashcardDeckCard key={deck.id} deck={deck} groupId={groupId} />
        ))}
      </div>
    </div>
  );
}