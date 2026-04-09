"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useFlashcardDeck,
  useDeleteDeck,
} from "@/hooks/api/use-flashcard-queries";
import { AddCardDialog } from "./add-card-dialog";
import { DeleteDeckDialog } from "./delete-deck-dialog";
import { Card, CardContent } from "@/components/ui/card";
import DOMPurify from "dompurify";

interface DeckEditorViewProps {
  deckId: string;
}

export function DeckEditorView({ deckId }: DeckEditorViewProps) {
  const router = useRouter();
  const { data: deck, isLoading, isError, error } = useFlashcardDeck(deckId);
  const deleteDeck = useDeleteDeck();
  const [addCardOpen, setAddCardOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteDeck.mutateAsync(deckId);
      toast.success("Deck deleted.");
      router.push("/studio/flashcards");
    } catch (err) {
      console.error("Failed to delete deck:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !deck) {
    return (
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/studio/flashcards")}>
          ← Back to Decks
        </Button>
        <p className="text-destructive">
          {error instanceof Error ? error.message : "Failed to load deck"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/studio/flashcards")}>
            ← Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{deck.title}</h1>
            <p className="text-sm text-muted-foreground">
              {deck.cardCount} {deck.cardCount === 1 ? "card" : "cards"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}>
            Delete Deck
          </Button>
          <Button onClick={() => setAddCardOpen(true)}>Add Card</Button>
        </div>
      </div>

      {deck.cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h2 className="mb-2 text-xl font-semibold">No cards yet</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Add your first flashcard to this deck.
          </p>
          <Button onClick={() => setAddCardOpen(true)}>Add Card</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {deck.cards.map((card) => (
            <Card key={card.id}>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Front</p>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(card.front),
                      }}
                    />
                  </div>
                  {card.back && (
                    <div>
                      <p className="text-xs text-muted-foreground">Back</p>
                      <div
                        className="text-sm"
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(card.back),
                        }}>
                      </div>
                    </div>
                  )}
                  {card.pronunciation && (
                    <p className="text-xs text-muted-foreground">
                      IPA: {card.pronunciation}
                    </p>
                  )}
                  {card.tags && card.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {card.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-secondary px-1.5 py-0.5 text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddCardDialog
        deckId={deckId}
        open={addCardOpen}
        onOpenChange={setAddCardOpen}
      />
      <DeleteDeckDialog
        deckId={deckId}
        deckTitle={deck.title}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        isDeleting={deleteDeck.isPending}
      />
    </div>
  );
}
