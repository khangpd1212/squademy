"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import type { DashboardDeckItem } from "@/hooks/api/use-dashboard-feed";
import { FlashcardDeckCard, FlashcardDeckCardSkeleton } from "./flashcard-deck-card";

type FlashcardDecksSectionProps = {
  decks: DashboardDeckItem[];
  isLoading: boolean;
};

export function FlashcardDecksSection({ decks, isLoading }: FlashcardDecksSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-(--dash-text-muted)" />
        <h2 className="text-lg font-semibold text-(--dash-text)">Luyện tập Flashcard</h2>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <FlashcardDeckCardSkeleton key={i} />
          ))}
        </div>
      ) : decks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-(--dash-border-subtle) p-8 text-center">
          <p className="text-sm text-(--dash-text-muted)">
            Chưa có flashcard nào.{" "}
            <Link
              href="/studio/flashcards"
              className="font-medium text-(--dash-primary) hover:underline"
            >
              Tạo trong Studio
            </Link>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {decks.map((deck) => (
            <FlashcardDeckCard key={deck.id} deck={deck} />
          ))}
        </div>
      )}
    </section>
  );
}
