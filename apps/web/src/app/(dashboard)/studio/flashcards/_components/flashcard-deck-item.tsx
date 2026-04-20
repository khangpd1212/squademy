"use client";

import {
  DeckGroup,
  FlashcardDeckItem as FlashcardDeckItemType,
} from "@/hooks/api/use-flashcard-queries";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

interface FlashcardDeckItemProps {
  deck: FlashcardDeckItemType;
  groups?: DeckGroup[];
  onClick: () => void;
}

export function FlashcardDeckItem({
  deck,
  groups,
  onClick,
}: FlashcardDeckItemProps) {
  return (
    <Card
      className="cursor-pointer hover:bg-accent/50"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}>
      <div className="flex items-center justify-between p-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-medium">{deck.title}</h3>
          <p className="text-sm text-muted-foreground">
            {deck.cardCount} {deck.cardCount === 1 ? "card" : "cards"}
          </p>
          {groups && groups.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Shared with: {groups.map((g) => g.groupName).join(", ")}
            </p>
          )}
        </div>
        <StatusBadge status={deck.status} />
      </div>
    </Card>
  );
}
