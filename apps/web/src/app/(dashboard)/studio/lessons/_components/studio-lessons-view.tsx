"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyLessons } from "@/hooks/api/use-lesson-queries";
import { EmptyLessonState } from "./empty-lesson-state";
import { LessonListItem } from "./lesson-list-item";
import { NewLessonDialog } from "./new-lesson-dialog";

export function StudioLessonsView() {
  const { data: lessons, isLoading, isError } = useMyLessons();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Lessons</h1>
          <p className="text-sm text-muted-foreground">
            Manage your lesson contributions.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>New Lesson</Button>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2" aria-label="Loading lessons">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-sm text-destructive">
          Failed to load lessons. Please refresh the page.
        </p>
      )}

      {!isLoading && !isError && lessons && (
        <>
          {lessons.length === 0 ? (
            <EmptyLessonState onNewLesson={() => setDialogOpen(true)} />
          ) : (
            <div className="flex flex-col gap-2">
              {lessons.map((lesson) => (
                <LessonListItem key={lesson.id} lesson={lesson} />
              ))}
            </div>
          )}
        </>
      )}

      <NewLessonDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
