"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";

interface SessionSummaryProps {
  totalCards: number;
  correctCount: number;
  accuracy: number;
}

export function SessionSummary({
  totalCards,
  accuracy,
}: SessionSummaryProps) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <h2 className="text-2xl font-bold">Session Complete!</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Cards Reviewed</p>
            <p className="text-3xl font-bold">{totalCards}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Accuracy</p>
            <p className="text-3xl font-bold">{accuracy}%</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          {accuracy >= 70 ? (
            <>
              <CheckCircle className="h-8 w-8 text-green-500" />
              <span className="text-green-500">Great job!</span>
            </>
          ) : (
            <>
              <XCircle className="h-8 w-8 text-yellow-500" />
              <span className="text-yellow-500">Keep practicing!</span>
            </>
          )}
        </div>

        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
          >
            Continue
          </Button>
          <Button onClick={() => router.push("/")} className="flex-1">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}