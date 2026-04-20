"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAheadCards, useDueCards } from "@/hooks/api/use-srs-progress";
import { queryKeys } from "@/lib/api/query-keys";
import { recordGrade } from "@/lib/dexie/sync";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, PlayCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import { FlashcardCard } from "./_components/flashcard-card";
import { KeyboardHints } from "./_components/keyboard-hints";
import { SessionSummary } from "./_components/session-summary";
import { useQueryClient } from "@tanstack/react-query";

type PageProps = {
  params: Promise<{ groupId: string; deckId: string }>;
};

export default function PracticeSessionPage({ params }: PageProps) {
  const queryClient = useQueryClient();
  const { groupId: _groupId, deckId } = use(params);
  const router = useRouter();

  const { data: dueCards = [], isLoading: isLoadingDue } = useDueCards(deckId);
  const { data: aheadCards = [], refetch: fetchAhead } = useAheadCards(deckId);

  const [isFlipped, setIsFlipped] = useState(false);
  const [grades, setGrades] = useState<{ cardId: string; grade: number }[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [studyAheadMode, setStudyAheadMode] = useState(false);

  const sessionCards = useMemo(() => {
    if (studyAheadMode) return [];
    return dueCards;
  }, [dueCards, studyAheadMode]);

  const displayCards = useMemo(() => {
    return studyAheadMode
      ? aheadCards.map((srs) => srs.card)
      : sessionCards.map((srs) => srs.card);
  }, [studyAheadMode, aheadCards, sessionCards]);

  const currentIndex = grades.length;
  const totalCards = displayCards.length;

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

  const handleGrade = async (grade: number) => {
    if (!displayCards || currentIndex >= displayCards.length) return;

    const card = displayCards[currentIndex];
    setGrades((prev) => [...prev, { cardId: card.id, grade }]);

    const srsProgress = studyAheadMode
      ? aheadCards[currentIndex]
      : sessionCards[currentIndex];

    await recordGrade(deckId, card.id, grade, {
      easeFactor: srsProgress?.easeFactor ?? 2.5,
      interval: srsProgress?.interval ?? 1,
      repetitions: srsProgress?.repetitions ?? 0,
    });

    if (currentIndex + 1 >= displayCards.length) {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.srs.due(deckId),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.srs.ahead(deckId),
      });
      if (studyAheadMode) {
        setStudyAheadMode(false);
      }
      setIsComplete(true);
    } else {
      setIsFlipped(false);
    }
  };

  const handleStudyAhead = useCallback(async () => {
    await fetchAhead();
    setStudyAheadMode(true);
    setIsFlipped(false);
    setIsComplete(false);
    setGrades([]);
  }, [fetchAhead]);

  const handleExitStudyAhead = useCallback(() => {
    setStudyAheadMode(false);
    setIsFlipped(false);
    setIsComplete(false);
  }, []);

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
        handleGrade(2);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, handleFlip, handleGrade, isComplete]);

  if (isLoadingDue) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (dueCards.length === 0 && !studyAheadMode) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-6">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="text-2xl font-bold">You&apos;re all caught up!</h2>
          <p className="text-muted-foreground">
            No cards due for review right now. Great job staying on top of your
            studies!
          </p>
          {aheadCards.length > 0 && (
            <Button onClick={handleStudyAhead} className="w-full gap-2">
              <PlayCircle className="h-4 w-4" />
              Study Ahead ({aheadCards.length} cards)
            </Button>
          )}
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex-1">
              Go Back
            </Button>
            <Button onClick={() => router.push("/")} className="flex-1">
              Done
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isComplete && !studyAheadMode) {
    const correctCount = grades.filter((g) => g.grade >= 2).length;
    const accuracy = Math.round((correctCount / grades.length) * 100);

    return (
      <SessionSummary
        totalCards={grades.length}
        correctCount={correctCount}
        accuracy={accuracy}
        onStudyAhead={aheadCards.length > 0 ? handleStudyAhead : undefined}
      />
    );
  }

  const currentCard = displayCards[currentIndex];

  if (!currentCard) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <p className="text-muted-foreground">No cards available</p>
          <Button onClick={() => router.back()} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col pb-20">
      {!isOnline && (
        <div className="bg-yellow-100 px-4 py-2 text-center text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
          Offline — changes will sync when connected
        </div>
      )}

      <div className="bg-primary text-primary-foreground px-4 py-2 text-center font-medium">
        {studyAheadMode ? (
          <span>Study Ahead — {aheadCards.length} cards</span>
        ) : (
          <span>{sessionCards.length} cards due today</span>
        )}
      </div>

      <div className="flex justify-between px-4 py-2 text-sm text-muted-foreground">
        <span>
          {currentIndex + 1} / {totalCards}
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
            className="w-full max-w-md">
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
          className="w-24">
          Again
        </Button>
        <Button
          variant={isFlipped ? "default" : "outline"}
          disabled={!isFlipped}
          onClick={() => handleGrade(2)}
          className="w-24 bg-green-600 hover:bg-green-700">
          Good
        </Button>
      </div>

      {studyAheadMode && (
        <div className="flex justify-center mt-4">
          <Button variant="ghost" onClick={handleExitStudyAhead}>
            Back to Due Cards
          </Button>
        </div>
      )}
    </div>
  );
}
