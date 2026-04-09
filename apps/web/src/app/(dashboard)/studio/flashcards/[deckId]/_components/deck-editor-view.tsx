"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useFlashcardDeck,
  useDeleteDeck,
  usePublishDeck,
  useAddDeckToGroup,
} from "@/hooks/api/use-flashcard-queries";
import { useMyGroups } from "@/hooks/api/use-group-queries";
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
  const publishDeck = usePublishDeck();
  const addToGroup = useAddDeckToGroup();
  const { data: groups = [] } = useMyGroups();
  const [addCardOpen, setAddCardOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  const handleDelete = async () => {
    try {
      await deleteDeck.mutateAsync(deckId);
      toast.success("Deck deleted.");
      router.push("/studio/flashcards");
    } catch (err) {
      console.error("Failed to delete deck:", err);
    }
  };

  const handlePublish = async () => {
    try {
      if (selectedGroups.length > 0) {
        for (const groupId of selectedGroups) {
          await addToGroup.mutateAsync({ deckId, groupId });
        }
        toast.success(`Added to ${selectedGroups.length} group(s)`);
      }
      if (deck?.status !== "published") {
        await publishDeck.mutateAsync(deckId);
        toast.success("Deck published successfully.");
      }
      setPublishDialogOpen(false);
      setSelectedGroups([]);
    } catch (err) {
      console.error("Failed to publish deck:", err);
    }
  };

  const toggleGroup = (groupId: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId],
    );
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
          {deck.status !== "published" && (
            <Button
              variant="outline"
              onClick={() => setPublishDialogOpen(true)}>
              Publish to Groups
            </Button>
          )}
          {deck.status === "published" && (
            <Button
              variant="outline"
              onClick={() => setPublishDialogOpen(true)}>
              Add to More Groups
            </Button>
          )}
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
                        }}></div>
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

      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish to Groups</DialogTitle>
            <DialogDescription>
              {deck.status === "published"
                ? "Add this deck to more groups."
                : "Publish this deck to make it available to group members."}
            </DialogDescription>
          </DialogHeader>

          {deck.cardCount === 0 && (
            <p className="text-sm text-destructive">
              Cannot publish an empty deck. Add at least one card first.
            </p>
          )}

          {deck.cardCount > 0 && groups.length > 0 && (
            <div className="space-y-2">
              <Label>Select Groups</Label>
              <div className="flex flex-wrap gap-2">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                      selectedGroups.includes(group.id)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background hover:bg-accent"
                    }`}>
                    {group.name}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Selected {selectedGroups.length} group(s)
              </p>
            </div>
          )}

          {deck.cardCount > 0 && groups.length === 0 && (
            <p className="text-sm text-muted-foreground">
              You are not a member of any groups. Join a group first to publish.
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPublishDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePublish}
              disabled={
                publishDeck.isPending ||
                addToGroup.isPending ||
                (deck.status !== "published" && deck.cardCount === 0) ||
                selectedGroups.length === 0
              }>
              {publishDeck.isPending || addToGroup.isPending
                ? "Publishing..."
                : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
