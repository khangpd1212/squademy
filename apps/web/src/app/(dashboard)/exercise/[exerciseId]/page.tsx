"use client";

import {
  ExerciseQuestion,
  useExercise,
  useSubmitExercise
} from "@/hooks/api/use-exercise-queries";
import { cn } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

function McqQuestion({
  question,
  answer,
  onAnswer,
}: {
  question: ExerciseQuestion;
  answer?: string;
  onAnswer: (value: string) => void;
}) {
  return (
    <div className="space-y-3">
      {question.options?.map((option) => (
        <label
          key={option.value}
          className={cn(
            "flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors",
            answer === option.value
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50",
          )}>
          <input
            type="radio"
            name={question.id}
            value={option.value}
            checked={answer === option.value}
            onChange={() => onAnswer(option.value)}
            className="w-5 h-5 text-primary"
          />
          <span className="text-foreground">{option.label}</span>
        </label>
      ))}
    </div>
  );
}

function FillBlankQuestion({
  question,
  answer,
  onAnswer,
}: {
  question: ExerciseQuestion;
  answer?: string;
  onAnswer: (value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-lg text-foreground">{question.prompt}</p>
      <input
        type="text"
        value={answer ?? ""}
        onChange={(e) => onAnswer(e.target.value)}
        placeholder="Your answer..."
        className="w-full p-4 rounded-lg border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
      />
    </div>
  );
}

function ClozeQuestion({
  question,
  answer,
  onAnswer,
}: {
  question: ExerciseQuestion;
  answer: string[];
  onAnswer: (values: string[]) => void;
}) {
  const answers = answer ?? [];
  const prompt = question.prompt;

  const parts = prompt.split(/\[blank\]/);

  return (
    <div className="space-y-4">
      <p className="text-lg text-foreground">
        {parts.map((part, idx) => (
          <span key={idx}>
            {part}
            {idx < parts.length - 1 && (
              <input
                type="text"
                value={answers[idx] ?? ""}
                onChange={(e) => {
                  const newAnswers = [...(answers ?? [])];
                  newAnswers[idx] = e.target.value;
                  onAnswer(newAnswers);
                }}
                className="inline-block w-32 mx-2 p-2 rounded border border-border bg-background text-foreground focus:border-primary focus:outline-none"
                placeholder={`blank ${idx + 1}`}
              />
            )}
          </span>
        ))}
      </p>
    </div>
  );
}

function DictationQuestion({
  question,
  answer,
  onAnswer,
}: {
  question: ExerciseQuestion;
  answer?: string;
  onAnswer: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      {question.audioUrl && (
        <audio controls src={question.audioUrl} className="w-full" />
      )}
      <input
        type="text"
        value={answer ?? ""}
        onChange={(e) => onAnswer(e.target.value)}
        placeholder="Type what you hear..."
        className="w-full p-4 rounded-lg border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
      />
    </div>
  );
}

function IpaQuestion({
  question,
  answer,
  onAnswer,
}: {
  question: ExerciseQuestion;
  answer?: string;
  onAnswer: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-2xl font-mono text-foreground">{question.ipa}</p>
      </div>
      <input
        type="text"
        value={answer ?? ""}
        onChange={(e) => onAnswer(e.target.value)}
        placeholder="Type the word..."
        className="w-full p-4 rounded-lg border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
      />
    </div>
  );
}

export default function ExercisePage() {
  const params = useParams();
  const router = useRouter();
  const exerciseId = params.exerciseId as string;

  const { data: exercise, isLoading, error } = useExercise(exerciseId);
  const submitMutation = useSubmitExercise();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [feedback, setFeedback] = useState<
    Record<string, { isCorrect: boolean; correctAnswer?: string }>
  >({});
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [focusEvents, setFocusEvents] = useState<
    { type: string; timestamp: string }[]
  >([]);
  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    correctCount: number;
    totalCount: number;
    timeTaken: number;
  } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timerStartedRef = useRef(false);

  const isGroupChallenge = exercise?.type === "group_challenge";

  useEffect(() => {
    if (isGroupChallenge) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }, [isGroupChallenge]);

  useEffect(() => {
    if (isGroupChallenge) {
      const handleVisibility = () => {
        if (document.hidden) {
          setFocusEvents((prev) => [
            ...prev,
            { type: "blur", timestamp: new Date().toISOString() },
          ]);
        }
      };
      document.addEventListener("visibilitychange", handleVisibility);
      return () =>
        document.removeEventListener("visibilitychange", handleVisibility);
    }
  }, [isGroupChallenge]);

  const startTimer = useCallback(() => {
    if (!timerStartedRef.current) {
      timerStartedRef.current = true;
      timerRef.current = setInterval(() => {
        setTimerSeconds((s) => s + 1);
      }, 1000);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 gap-4">
        <p className="text-destructive">Failed to load exercise</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground">
          Go Back
        </button>
      </div>
    );
  }

  if (showResults && result) {
    return (
      <div className="max-w-lg mx-auto p-6 space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Quiz Complete!</h1>
          <div className="text-6xl font-bold text-primary">
            {Math.round(result.score)}%
          </div>
          <p className="text-lg text-muted-foreground">
            {result.correctCount} / {result.totalCount} correct
          </p>
          <p className="text-muted-foreground">Time: {result.timeTaken}s</p>
        </div>
        <button
          onClick={() => router.back()}
          className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium">
          Back to Group
        </button>
      </div>
    );
  }

  const questions = exercise.questions;
  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentQuestion?.id];

  const handleAnswer = (value: string) => {
    startTimer();
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));

    const correctAnswers = currentQuestion.answers as
      | string
      | string[]
      | undefined;
    let isCorrect = false;
    if (correctAnswers) {
      if (typeof correctAnswers === "string") {
        isCorrect =
          value.trim().toLowerCase() === correctAnswers.trim().toLowerCase();
      } else if (Array.isArray(correctAnswers) && typeof value === "string") {
        isCorrect = correctAnswers.some(
          (ca) => ca.trim().toLowerCase() === value.trim().toLowerCase(),
        );
      }
    }

    setFeedback((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        isCorrect,
        correctAnswer: String(correctAnswers ?? ""),
      },
    }));
  };

  const handleSubmit = async () => {
    if (!navigator.onLine) {
      alert("Internet connection required to submit quiz");
      return;
    }

    const formattedAnswers = questions.map((q) => ({
      questionId: q.id,
      answer: answers[q.id] ?? "",
    }));

    try {
      const res = await submitMutation.mutateAsync({
        exerciseId,
        data: {
          answers: formattedAnswers,
          timeTaken: timerSeconds,
          focusEvents: focusEvents.length > 0 ? focusEvents : undefined,
        },
      });

      setResult(res);
      setShowResults(true);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    } catch (err) {
      console.error("Failed to submit:", err);
    }
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    const questionType = currentQuestion.type;

    switch (questionType) {
      case "mcq":
        return (
          <McqQuestion
            question={currentQuestion}
            answer={currentAnswer as string | undefined}
            onAnswer={handleAnswer}
          />
        );
      case "fill_blank":
        return (
          <FillBlankQuestion
            question={currentQuestion}
            answer={currentAnswer as string | undefined}
            onAnswer={handleAnswer}
          />
        );
      case "dictation":
        return (
          <DictationQuestion
            question={currentQuestion}
            answer={currentAnswer as string | undefined}
            onAnswer={handleAnswer}
          />
        );
      case "cloze":
        return (
          <ClozeQuestion
            question={currentQuestion}
            answer={(currentAnswer as string[]) ?? []}
            onAnswer={(values) => {
              startTimer();
              setAnswers((prev) => ({ ...prev, [currentQuestion.id]: values }));
            }}
          />
        );
      case "ipa_to_word":
        return (
          <IpaQuestion
            question={currentQuestion}
            answer={currentAnswer as string | undefined}
            onAnswer={handleAnswer}
          />
        );
      default:
        return <p>Unknown question type</p>;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {isGroupChallenge && (
        <div className="flex items-center justify-between">
          <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-500 text-sm font-medium">
            Focus Mode Active
          </span>
          <span className="text-muted-foreground">{timerSeconds}s</span>
        </div>
      )}

      {focusEvents.length > 0 && (
        <div className="p-3 rounded-lg bg-yellow-500/20 text-yellow-500 text-sm">
          Tab switch detected. Your activity is being logged.
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Question {currentIndex + 1} of {questions.length}
        </p>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{
              width: `${((currentIndex + 1) / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {currentQuestion && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">
            {currentQuestion.prompt}
          </h2>
          {renderQuestion()}
        </div>
      )}

      {currentQuestion && feedback[currentQuestion.id] && (
        <div
          className={cn(
            "p-4 rounded-lg",
            feedback[currentQuestion.id].isCorrect
              ? "bg-green-500/20 text-green-500"
              : "bg-red-500/20 text-red-500",
          )}>
          {feedback[currentQuestion.id].isCorrect
            ? "Correct!"
            : `Incorrect. The answer is: ${feedback[currentQuestion.id].correctAnswer}`}
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="flex-1 py-3 rounded-lg border-2 border-border text-foreground disabled:opacity-50">
          Previous
        </button>
        {currentIndex < questions.length - 1 ? (
          <button
            onClick={() =>
              setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))
            }
            className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-medium">
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50">
            {submitMutation.isPending ? "Submitting..." : "Submit Quiz"}
          </button>
        )}
      </div>
    </div>
  );
}
