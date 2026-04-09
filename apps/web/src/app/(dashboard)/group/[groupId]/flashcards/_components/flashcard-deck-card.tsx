"use client";

import { toast } from "sonner";
import { GroupFlashcardDeck } from "@/hooks/api/use-flashcard-queries";
import { User } from "lucide-react";

interface FlashcardDeckCardProps {
  deck: GroupFlashcardDeck;
  groupId: string;
}

export function FlashcardDeckCard({ deck, groupId }: FlashcardDeckCardProps) {
  const handlePractice = (e: React.MouseEvent) => {
    e.preventDefault();
    if (deck.cardCount === 0) {
      toast.error("This deck has no cards to practice");
      return;
    }
    window.location.href = `/group/${groupId}/flashcards/${deck.id}/practice`;
  };

  return (
    <div className="group block rounded-lg border bg-card p-4 transition-colors hover:bg-accent">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium group-hover:text-primary">
            {deck.title}
          </h3>
          {deck.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {deck.description}
            </p>
          )}
          <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {deck.author.displayName || "Unknown"}
            </span>
            <span>{deck.cardCount} cards</span>
            <span>
              {deck.updatedAt
                ? new Date(deck.updatedAt).toLocaleDateString()
                : ""}
            </span>
          </div>
        </div>
        <button
          onClick={handlePractice}
          className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:mt-0"
        >
          Practice
        </button>
      </div>
    </div>
  );
}