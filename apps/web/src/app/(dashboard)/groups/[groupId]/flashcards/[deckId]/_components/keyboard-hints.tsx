"use client";

interface KeyboardHintsProps {
  isFlipped: boolean;
}

export function KeyboardHints({ isFlipped }: KeyboardHintsProps) {
  return (
    <div className="mt-4 text-center text-sm text-muted-foreground opacity-50">
      {isFlipped ? (
        <span>
          ← Again&nbsp;&nbsp;&nbsp;Good →
        </span>
      ) : (
        <span>Space to flip</span>
      )}
    </div>
  );
}