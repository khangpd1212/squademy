"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardDeckItem } from "@/hooks/api/use-dashboard-feed";

const DECK_COLORS = [
  { border: "border-(--dash-primary)", bg: "bg-(--dash-primary)/10", text: "text-(--dash-primary)" },
  { border: "border-amber-500", bg: "bg-amber-500/10", text: "text-amber-500" },
  { border: "border-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-500" },
  { border: "border-purple-500", bg: "bg-purple-500/10", text: "text-purple-500" },
  { border: "border-pink-500", bg: "bg-pink-500/10", text: "text-pink-500" },
  { border: "border-cyan-500", bg: "bg-cyan-500/10", text: "text-cyan-500" },
];

const DEFAULT_COLOR = { border: "border-(--dash-border)", bg: "bg-(--dash-glass-active)", text: "text-(--dash-text-muted)" };

function getDeckColor(deckId: string) {
  if (!deckId) return DEFAULT_COLOR;
  let hash = 0;
  for (let i = 0; i < deckId.length; i++) {
    hash = ((hash << 5) - hash) + deckId.charCodeAt(i);
    hash |= 0;
  }
  return DECK_COLORS[Math.abs(hash) % DECK_COLORS.length];
}

type FlashcardDeckCardProps = {
  deck: DashboardDeckItem;
};

export function FlashcardDeckCard({ deck }: FlashcardDeckCardProps) {
  const color = getDeckColor(deck.id);

  return (
    <Link href={`/group/${deck.groupId}/flashcards/${deck.id}`} className="block">
      <div
        className={cn(
          "group relative overflow-hidden rounded-(--dash-radius-lg) border border-(--dash-border-subtle) bg-(--dash-glass) backdrop-blur-xl transition-all hover:shadow-(--dash-shadow-md) hover:-translate-y-0.5",
          "border-l-[3px]",
          color.border,
        )}
      >
        <div className="p-5">
          <div className="mb-3 flex items-center gap-3">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", color.bg)}>
              <FileText className={cn("h-5 w-5", color.text)} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold text-(--dash-text)">
                {deck.title}
              </h3>
              <p className="text-xs text-(--dash-text-subtle)">{deck.groupName}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", color.bg, color.text)}>
              {deck.cardCount} {deck.cardCount === 1 ? "card" : "cards"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function FlashcardDeckCardSkeleton() {
  return (
    <div className="rounded-(--dash-radius-lg) border border-(--dash-border-subtle) bg-(--dash-glass) p-5">
      <div className="mb-3 flex items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-lg bg-(--dash-glass-active)" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 animate-pulse rounded bg-(--dash-glass-active)" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-(--dash-glass-active)" />
        </div>
      </div>
      <div className="h-5 w-16 animate-pulse rounded-full bg-(--dash-glass-active)" />
    </div>
  );
}
