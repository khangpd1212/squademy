"use client";

import { useReviewQueue } from "@/hooks/api";
import Link from "next/link";
import { FileText, Clock, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function LessonReviewQueuePage() {
  const { data: queue, isLoading, error } = useReviewQueue();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Lesson Review Queue</h1>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Lesson Review Queue</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
          Failed to load review queue. Please try again.
        </div>
      </div>
    );
  }

  if (!queue || queue.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Lesson Review Queue</h1>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="text-lg font-semibold">All caught up!</h2>
          <p className="text-muted-foreground">No lessons pending review.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Lesson Review Queue</h1>
      <p className="text-muted-foreground">
        {queue.length} lesson{queue.length === 1 ? "" : "s"} waiting for review
      </p>
      <div className="space-y-2">
        {queue.map((lesson) => (
          <Link
            key={lesson.id}
            href={`/review/lesson/${lesson.id}`}
            className="block rounded-lg border bg-card p-4 transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold">{lesson.title}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {lesson.author.displayName || lesson.author.fullName || "Unknown"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(lesson.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                In Review
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
