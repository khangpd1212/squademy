"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";
import { FlashcardCardItem } from "@/types/flashcard";

interface FlashcardCardProps {
  card: FlashcardCardItem;
  onFlip?: () => void;
  isFlipped: boolean;
}

export function FlashcardCard({ card, onFlip, isFlipped }: FlashcardCardProps) {
  const handleTap = useCallback(() => {
    if (!isFlipped) {
      onFlip?.();
    }
  }, [isFlipped, onFlip]);

  return (
    <div className="relative w-full max-w-md mx-auto perspective-1000">
      <motion.div
        className="relative w-full h-80 cursor-pointer preserve-3d"
        onClick={handleTap}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div
          className="absolute inset-0 rounded-xl border bg-card p-6 shadow-lg backface-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="flex h-full flex-col items-center justify-center">
            <div className="text-center text-lg font-medium">
              {card.front}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Tap to reveal
            </p>
          </div>
        </div>

        <div
          className="absolute inset-0 rounded-xl border bg-card p-6 shadow-lg backface-hidden"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="flex h-full flex-col overflow-auto">
            <div className="text-center text-lg font-medium">
              {card.back || "No answer"}
            </div>

            {card.pronunciation && (
              <p className="mt-3 text-center text-sm text-muted-foreground">
                [{card.pronunciation}]
              </p>
            )}

            {card.exampleSentence && (
              <p className="mt-3 text-center text-sm italic text-muted-foreground">
                {card.exampleSentence}
              </p>
            )}

            {card.audioUrl && (
              <div className="mt-4 flex justify-center">
                <audio controls className="h-8 w-48">
                  <source src={card.audioUrl} type="audio/mpeg" />
                  Your browser does not support audio.
                </audio>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}