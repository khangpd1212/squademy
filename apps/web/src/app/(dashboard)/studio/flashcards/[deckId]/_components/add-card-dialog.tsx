"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VALIDATION } from "@squademy/shared";
import { useAddCard } from "@/hooks/api/use-flashcard-queries";

const addCardSchema = z.object({
  front: z.string().min(1, "Front side is required").max(1000),
  back: z.string().max(2000).optional(),
  pronunciation: z.string().max(100).optional(),
  exampleSentence: z.string().max(VALIDATION.PROFILE_FIELD_MAX).optional(),
  tags: z.string().optional(),
  extraNotes: z.string().max(2000).optional(),
});

type AddCardForm = z.infer<typeof addCardSchema>;

interface AddCardDialogProps {
  deckId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddCardDialog({ deckId, open, onOpenChange }: AddCardDialogProps) {
  const addCard = useAddCard();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AddCardForm>({
    resolver: zodResolver(addCardSchema),
  });

  const onSubmit = async (data: AddCardForm) => {
    setError(null);
    try {
      await addCard.mutateAsync({
        deckId,
        data: {
          front: data.front,
          back: data.back,
          pronunciation: data.pronunciation,
          exampleSentence: data.exampleSentence,
          tags: data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
          extraNotes: data.extraNotes,
        },
      });
      reset();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add card");
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      reset();
      setError(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Card</DialogTitle>
          <DialogDescription>
            Add a new flashcard to this deck.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="front">Front *</Label>
            <Textarea
              id="front"
              placeholder="Question or term"
              {...register("front")}
            />
            {errors.front && (
              <p className="text-sm text-destructive">{errors.front.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="back">Back</Label>
            <Textarea
              id="back"
              placeholder="Answer or definition"
              {...register("back")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pronunciation">Pronunciation (IPA)</Label>
            <Input
              id="pronunciation"
              placeholder="e.g., /həˈloʊ/"
              {...register("pronunciation")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="exampleSentence">Example Sentence</Label>
            <Input
              id="exampleSentence"
              placeholder="Use the word in a sentence"
              {...register("exampleSentence")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              placeholder="e.g., vocabulary, chapter1, hard"
              {...register("tags")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="extraNotes">Extra Notes</Label>
            <Textarea
              id="extraNotes"
              placeholder="Additional notes or explanations"
              {...register("extraNotes")}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addCard.isPending}>
              {addCard.isPending ? "Adding..." : "Add Card"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}