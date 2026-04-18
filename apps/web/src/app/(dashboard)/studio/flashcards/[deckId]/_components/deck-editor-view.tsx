"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
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
  useDeckGroups,
  useUpdatePublishGroups,
} from "@/hooks/api/use-flashcard-queries";
import { useEditableGroups } from "@/hooks/api/use-group-queries";
import { AddCardDialog } from "./add-card-dialog";
import { DeleteDeckDialog } from "./delete-deck-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { BookOpen } from "lucide-react";
import DOMPurify from "dompurify";

interface DeckEditorViewProps {
  deckId: string;
}

type PublishForm = {
  groupIds: string[];
};

export function DeckEditorView({ deckId }: DeckEditorViewProps) {
  const router = useRouter();
  const { data: deck, isLoading, isError, error } = useFlashcardDeck(deckId);
  const deleteDeck = useDeleteDeck();
  const updatePublishGroups = useUpdatePublishGroups();
  const { data: myGroups = [] } = useEditableGroups();
  const { data: deckGroups = [], refetch: refetchDeckGroups } =
    useDeckGroups(deckId);
  const [addCardOpen, setAddCardOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);

  const publishedGroupIds = deckGroups.map((g) => g.groupId);

  const publishForm = useForm<PublishForm>({
    defaultValues: {
      groupIds: publishedGroupIds,
    },
  });
  const groupIds = useWatch({ control: publishForm.control, name: "groupIds" });

  const handleDelete = async () => {
    try {
      await deleteDeck.mutateAsync(deckId);
      toast.success("Deck deleted.");
      router.push("/studio/flashcards");
    } catch (err) {
      console.error("Failed to delete deck:", err);
    }
  };

  const handlePublish = async (data: PublishForm) => {
    try {
      const result = await updatePublishGroups.mutateAsync({
        deckId,
        groupIds: data.groupIds,
      });

      if (result.published) {
        toast.success("Deck published successfully.");
      }
      if (result.added > 0) {
        toast.success(`Added to ${result.added} group(s)`);
      }
      if (result.removed > 0) {
        toast.success(`Removed from ${result.removed} group(s)`);
      }

      setPublishDialogOpen(false);
      refetchDeckGroups();
    } catch (err) {
      console.error("Failed to update groups:", err);
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
            variant="outline"
            onClick={() => {
              publishForm.reset({ groupIds: publishedGroupIds });
              setPublishDialogOpen(true);
            }}>
            Publish to Groups
          </Button>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}>
            Delete Deck
          </Button>
          <Button onClick={() => setAddCardOpen(true)}>Add Card</Button>
        </div>
      </div>

      {deck.cards.length === 0 ? (
        <Empty
          icon={BookOpen}
          title="No cards yet"
          description="Add your first flashcard to this deck."
          action={
            <Button onClick={() => setAddCardOpen(true)}>Add Card</Button>
          }
        />
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

      <Dialog
        open={publishDialogOpen}
        onOpenChange={(open) => {
          setPublishDialogOpen(open);
          if (open) {
            publishForm.reset({ groupIds: publishedGroupIds });
          }
        }}>
        <DialogContent>
          <form
            onSubmit={publishForm.handleSubmit(handlePublish)}
            className="space-y-4">
            <DialogHeader>
              <DialogTitle>Publish to Groups</DialogTitle>
              <DialogDescription>
                Add this deck to groups. It will be automatically published.
              </DialogDescription>
            </DialogHeader>

            {deck.cardCount === 0 && (
              <p className="text-sm text-destructive">
                Cannot publish an empty deck. Add at least one card first.
              </p>
            )}

            {deck.cardCount > 0 && myGroups.length > 0 && (
              <div className="space-y-2">
                <Label>Select Groups</Label>
                <div className="flex flex-wrap gap-2">
                  {myGroups.map((group) => {
                    const isSelected = groupIds.includes(group.id);
                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => {
                          const current = publishForm.getValues("groupIds");
                          const newGroups = current.includes(group.id)
                            ? current.filter((id) => id !== group.id)
                            : [...current, group.id];
                          publishForm.setValue("groupIds", newGroups);
                        }}
                        className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input bg-background hover:bg-accent"
                        }`}>
                        {group.name}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Selected {groupIds.length} group(s)
                </p>
              </div>
            )}

            {deck.cardCount > 0 && myGroups.length === 0 && (
              <p className="text-sm text-muted-foreground">
                You are not an admin or editor of any groups. Join a group as
                admin or editor to publish.
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
                type="submit"
                disabled={
                  updatePublishGroups.isPending ||
                  deck.cardCount === 0 ||
                  groupIds.length === 0
                }>
                {updatePublishGroups.isPending ? "Publishing..." : "Publish"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
