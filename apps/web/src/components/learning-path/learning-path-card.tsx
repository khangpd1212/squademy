"use client";

import Link from "next/link";
import { BookOpen, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LearningPathItem } from "@/hooks/api/use-group-learning-path";

interface LearningPathCardProps {
  item: LearningPathItem;
  groupId: string;
}

export function LearningPathCard({ item, groupId }: LearningPathCardProps) {
  const hasLesson = item.lesson !== null;
  const hasDeck = item.deck !== null;

  if (hasLesson) {
    const contributor = hasLesson ? item.lesson!.author.displayName : null;
    return (
      <div className="group flex items-center justify-between gap-4 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex shrink-0 items-center justify-center w-8 h-8 rounded-full bg-primary/10">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-sm">{item.lesson!.title}</p>
            {contributor && (
              <p className="text-xs text-muted-foreground truncate">
                by {contributor}
              </p>
            )}
          </div>
        </div>
        <Link href={`/group/${groupId}/lessons/${item.lesson!.id}`}>
          <Button size="sm" className="sq-btn-green shrink-0">
            Read
          </Button>
        </Link>
      </div>
    );
  }

  if (hasDeck) {
    return (
      <div className="group flex items-center justify-between gap-4 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex shrink-0 items-center justify-center w-8 h-8 rounded-full bg-secondary/10">
            <FileText className="h-4 w-4 text-secondary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-sm">{item.deck!.title}</p>
            <p className="text-xs text-muted-foreground">Flashcard deck</p>
          </div>
        </div>
        <Link href={`/group/${groupId}/flashcards/${item.deck!.id}`}>
          <Button size="sm" variant="outline" className="shrink-0">
            Study
          </Button>
        </Link>
      </div>
    );
  }

  return null;
}
