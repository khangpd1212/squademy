"use client";

import { use } from "react";
import Link from "next/link";
import { useGroupPublishedLessons } from "@/hooks/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty } from "@/components/ui/empty";
import { BookOpen, User } from "lucide-react";

type PageProps = {
  params: Promise<{ groupId: string }>;
};

export default function GroupLessonsPage({ params }: PageProps) {
  const { groupId } = use(params);
  const { data: lessons, isLoading } = useGroupPublishedLessons(groupId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!lessons || lessons.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Lessons</h2>
        <Empty
          icon={BookOpen}
          title="No published lessons yet."
          description="Publish your first lesson to get started."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Lessons</h2>
      <div className="grid gap-3">
        {lessons.map((lesson) => (
          <Link
            key={lesson.id}
            href={`/group/${groupId}/lessons/${lesson.id}`}
            className="group block rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
          >
            <h3 className="font-medium group-hover:text-primary">
              {lesson.title}
            </h3>
            <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {lesson.author.displayName || lesson.author.fullName || "Unknown"}
              </span>
              <span>
                {lesson.updatedAt
                  ? new Date(lesson.updatedAt).toLocaleDateString()
                  : ""}
              </span>
            </div>
            {lesson.contentMarkdown && (
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {lesson.contentMarkdown.slice(0, 150)}...
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}