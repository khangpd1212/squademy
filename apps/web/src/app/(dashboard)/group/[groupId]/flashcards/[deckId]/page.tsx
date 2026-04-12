"use client";

import { use } from "react";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useFlashcardCards } from "@/hooks/api/use-flashcard-cards";
import { recordGrade } from "@/lib/dexie/sync";
import { FlashcardCard } from "./_components/flashcard-card";
import { SessionSummary } from "./_components/session-summary";
import { KeyboardHints } from "./_components/keyboard-hints";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

type PageProps = {
  params: Promise<{ groupId: string; deckId: string }>;
};

export default function PracticeSessionPage({ params }: PageProps) {
  const { groupId: _groupId, deckId } = use(params);
  const router = useRouter();

  const { data: cards, isLoading, error } = useFlashcardCards(deckId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [grades, setGrades] = useState<{ cardId: string; grade: number }[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleFlip = useCallback(() => {
    setIsFlipped(true);
  }, []);

  const handleGrade = useCallback(
    async (grade: number) => {
      if (!cards || currentIndex >= cards.length) return;

      const card = cards[currentIndex];
      setGrades((prev) => [...prev, { cardId: card.id, grade }]);

      await recordGrade(deckId, card.id, grade);

      if (currentIndex + 1 >= cards.length) {
        setIsComplete(true);
      } else {
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
      }
    },
    [cards, currentIndex, deckId],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isComplete) return;

      if (e.code === "Space" && !isFlipped) {
        e.preventDefault();
        handleFlip();
      } else if (e.code === "ArrowLeft" && isFlipped) {
        e.preventDefault();
        handleGrade(0);
      } else if (e.code === "ArrowRight" && isFlipped) {
        e.preventDefault();
        handleGrade(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, handleFlip, handleGrade, isComplete]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (error || !cards || cards.length === 0) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">
          {error?.message || "No cards available"}
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.back()}
        >
          Go Back
        </Button>
      </div>
    );
  }

  if (isComplete) {
    const correctCount = grades.filter((g) => g.grade === 1).length;
    const accuracy = Math.round((correctCount / grades.length) * 100);
    return (
      <SessionSummary
        totalCards={cards.length}
        correctCount={correctCount}
        accuracy={accuracy}
      />
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <div className="flex min-h-screen flex-col pb-20">
      {!isOnline && (
        <div className="bg-yellow-100 px-4 py-2 text-center text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
          Offline — changes will sync when connected
        </div>
      )}

      <div className="flex justify-between px-4 py-2 text-sm text-muted-foreground">
        <span>
          {currentIndex + 1} / {cards.length}
        </span>
        <span>{isFlipped ? "Flipped" : "Front"}</span>
      </div>

      <div className="flex flex-1 items-center justify-center px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard.id}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full max-w-md"
          >
            <FlashcardCard
              card={currentCard}
              onFlip={handleFlip}
              isFlipped={isFlipped}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <KeyboardHints isFlipped={isFlipped} />

      <div className="flex justify-center gap-4 mt-4">
        <Button
          variant={isFlipped ? "destructive" : "outline"}
          disabled={!isFlipped}
          onClick={() => handleGrade(0)}
          className="w-24"
        >
          Again
        </Button>
        <Button
          variant={isFlipped ? "default" : "outline"}
          disabled={!isFlipped}
          onClick={() => handleGrade(1)}
          className="w-24 bg-green-600 hover:bg-green-700"
        >
          Good
        </Button>
      </div>
    </div>
  );
}