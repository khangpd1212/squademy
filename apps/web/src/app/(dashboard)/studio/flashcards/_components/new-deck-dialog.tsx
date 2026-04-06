"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateDeck } from "@/hooks/api/use-flashcard-queries";

const createDeckSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
});

type CreateDeckForm = z.infer<typeof createDeckSchema>;

interface NewDeckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewDeckDialog({ open, onOpenChange }: NewDeckDialogProps) {
  const router = useRouter();
  const createDeck = useCreateDeck();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateDeckForm>({
    resolver: zodResolver(createDeckSchema),
  });

  const onSubmit = async (data: CreateDeckForm) => {
    setError(null);
    try {
      const deck = await createDeck.mutateAsync({ title: data.title });
      reset();
      onOpenChange(false);
      router.push(`/studio/flashcards/${deck.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create deck");
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Deck</DialogTitle>
          <DialogDescription>
            Give your flashcard deck a descriptive title.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g., Spanish Vocabulary"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createDeck.isPending}>
              {createDeck.isPending ? "Creating..." : "Create Deck"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}