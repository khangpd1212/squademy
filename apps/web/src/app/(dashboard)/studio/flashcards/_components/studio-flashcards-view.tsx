"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFlashcardDecks } from "@/hooks/api/use-flashcard-queries";
import { NewDeckDialog } from "./new-deck-dialog";
import { ImportAnkiDialog } from "./import-anki-dialog";
import { FlashcardDeckItem } from "./flashcard-deck-item";

export function StudioFlashcardsView() {
  const router = useRouter();
  const { data: decks, isLoading, isError } = useFlashcardDecks();
  const [newDeckDialogOpen, setNewDeckDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Flashcard Decks</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage your flashcard decks.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            Import Anki Deck
          </Button>
          <Button onClick={() => setNewDeckDialogOpen(true)}>New Deck</Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2" aria-label="Loading decks">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-sm text-destructive">
          Failed to load decks. Please refresh the page.
        </p>
      )}

      {!isLoading && !isError && decks && (
        <>
          {decks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <h2 className="mb-2 text-xl font-semibold">No flashcard decks yet</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Create your first deck or import an existing Anki deck.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                  Import Anki Deck
                </Button>
                <Button onClick={() => setNewDeckDialogOpen(true)}>New Deck</Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {decks.map((deck) => (
                <FlashcardDeckItem
                  key={deck.id}
                  deck={deck}
                  onClick={() => router.push(`/studio/flashcards/${deck.id}`)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <NewDeckDialog open={newDeckDialogOpen} onOpenChange={setNewDeckDialogOpen} />
      <ImportAnkiDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />
    </div>
  );
}
