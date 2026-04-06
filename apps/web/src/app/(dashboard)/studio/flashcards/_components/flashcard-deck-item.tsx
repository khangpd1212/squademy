"use client";

import { FlashcardDeckItem as FlashcardDeckItemType } from "@/hooks/api/use-flashcard-queries";
import { Card } from "@/components/ui/card";

interface FlashcardDeckItemProps {
  deck: FlashcardDeckItemType;
  onClick: () => void;
}

export function FlashcardDeckItem({ deck, onClick }: FlashcardDeckItemProps) {
  const statusBadge =
    deck.status === "published" ? (
      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
        Published
      </span>
    ) : (
      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
        Draft
      </span>
    );

  return (
    <Card
      className="cursor-pointer hover:bg-accent/50"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-medium">{deck.title}</h3>
          <p className="text-sm text-muted-foreground">
            {deck.cardCount} {deck.cardCount === 1 ? "card" : "cards"}
          </p>
        </div>
        {statusBadge}
      </div>
    </Card>
  );
}