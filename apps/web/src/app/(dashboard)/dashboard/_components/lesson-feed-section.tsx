"use client";

import { BookOpenText } from "lucide-react";
import type { DashboardLessonItem } from "@/hooks/api/use-dashboard-feed";
import { LessonFeedCard, LessonFeedCardSkeleton } from "./lesson-feed-card";

type LessonFeedSectionProps = {
  lessons: DashboardLessonItem[];
  isLoading: boolean;
};

export function LessonFeedSection({ lessons, isLoading }: LessonFeedSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <BookOpenText className="h-5 w-5 text-(--dash-text-muted)" />
        <h2 className="text-lg font-semibold text-(--dash-text)">Lý thuyết mới nhất</h2>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <LessonFeedCardSkeleton key={i} />
          ))}
        </div>
      ) : lessons.length === 0 ? (
        <div className="rounded-xl border border-dashed border-(--dash-border-subtle) p-8 text-center">
          <p className="text-sm text-(--dash-text-muted)">
            Chưa có bài giảng lý thuyết nào.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson) => (
            <LessonFeedCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      )}
    </section>
  );
}
