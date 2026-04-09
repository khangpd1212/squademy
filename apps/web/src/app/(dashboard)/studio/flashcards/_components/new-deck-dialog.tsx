"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateDeck } from "@/hooks/api/use-flashcard-queries";
import { useMyGroups } from "@/hooks/api/use-group-queries";

const createDeckSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string().max(500, "Description is too long").optional(),
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
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  const { data: groups = [] } = useMyGroups();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateDeckForm>({
    resolver: zodResolver(createDeckSchema),
  });

  const toggleGroup = (groupId: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const onSubmit = async (data: CreateDeckForm) => {
    setError(null);
    try {
      const deck = await createDeck.mutateAsync({
        title: data.title,
        description: data.description,
        groupIds: selectedGroups,
      });
      reset();
      setSelectedGroups([]);
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
      setSelectedGroups([]);
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

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="What can you learn with this deck?"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {groups.length > 0 && (
            <div className="space-y-2">
              <Label>Add to Groups (optional)</Label>
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
                    }`}
                  >
                    {group.name}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Selected {selectedGroups.length} group(s)
              </p>
            </div>
          )}

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