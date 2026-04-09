"use client";

import { useState, useRef } from "react";
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
import { toast } from "sonner";
import { useImportAnkiDeck } from "@/hooks/api/use-flashcard-queries";
import { useMyGroups } from "@/hooks/api/use-group-queries";
import { parseAnkiDeck, type AnkiParsedCard } from "@/lib/anki/parser";

const importSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
});

type ImportForm = z.infer<typeof importSchema>;

interface ImportAnkiDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportAnkiDialog({ open, onOpenChange }: ImportAnkiDialogProps) {
  const router = useRouter();
  const importDeck = useImportAnkiDeck();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedCards, setParsedCards] = useState<AnkiParsedCard[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  const { data: groups = [] } = useMyGroups();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ImportForm>({
    resolver: zodResolver(importSchema),
  });

  const toggleGroup = (groupId: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".apkg")) {
      setParseError("Please select a .apkg file");
      return;
    }

    setSelectedFile(file);
    setParseError(null);
    setIsProcessing(true);

    try {
      const cards = await parseAnkiDeck(file);
      setParsedCards(cards);
    } catch (err) {
      setParsedCards([]);
      setParseError(
        err instanceof Error
          ? err.message
          : "Could not parse this file. Please check it is a valid Anki .apkg file."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const onSubmit = async (data: ImportForm) => {
    if (parsedCards.length === 0) {
      setParseError("No cards found in the selected file");
      return;
    }

    setParseError(null);
    try {
      const deck = await importDeck.mutateAsync({
        title: data.title,
        cards: parsedCards.map((card) => ({
          front: card.front,
          back: card.back ?? undefined,
          pronunciation: card.pronunciation ?? undefined,
          exampleSentence: card.exampleSentence ?? undefined,
          tags: card.tags ?? undefined,
          extraNotes: card.extraNotes ?? undefined,
        })),
        groupIds: selectedGroups,
      });
      reset();
      setSelectedFile(null);
      setParsedCards([]);
      setSelectedGroups([]);
      onOpenChange(false);
      toast.success(`Imported ${parsedCards.length} cards successfully.`);
      router.push(`/studio/flashcards/${deck.id}`);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Failed to import deck");
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      reset();
      setSelectedFile(null);
      setParsedCards([]);
      setParseError(null);
      setSelectedGroups([]);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Anki Deck</DialogTitle>
          <DialogDescription>
            Select a .apkg file to import flashcards.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apkg-file">Anki File (.apkg)</Label>
            <Input
              id="apkg-file"
              type="file"
              accept=".apkg"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            {isProcessing && (
              <p className="text-sm text-muted-foreground">Processing file...</p>
            )}
            {selectedFile && parsedCards.length > 0 && (
              <p className="text-sm text-green-600">
                Found {parsedCards.length} cards
              </p>
            )}
            {parseError && (
              <p className="text-sm text-destructive">{parseError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Deck Title</Label>
            <Input
              id="title"
              placeholder="e.g., Japanese N5 Vocabulary"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={importDeck.isPending || parsedCards.length === 0}
            >
              {importDeck.isPending ? "Importing..." : "Import Deck"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}