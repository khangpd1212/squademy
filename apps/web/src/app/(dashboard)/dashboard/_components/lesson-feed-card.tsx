"use client";

import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";
import type { DashboardLessonItem } from "@/hooks/api/use-dashboard-feed";

function getPreview(markdown: string | null): string {
  if (!markdown) return "";
  const text = markdown
    .replace(/[#*_>`~\[\]]/g, "")
    .replace(/\n{2,}/g, " ")
    .trim();
  return text.length > 200 ? text.slice(0, 200) + "..." : text;
}

type LessonFeedCardProps = {
  lesson: DashboardLessonItem;
};

export function LessonFeedCard({ lesson }: LessonFeedCardProps) {
  return (
    <Link
      href={`/group/${lesson.groupId}/lessons/${lesson.id}`}
      className="block"
    >
      <div className="group rounded-(--dash-radius-lg) border border-(--dash-border-subtle) bg-(--dash-glass) p-5 backdrop-blur-xl transition-all hover:border-(--dash-border) hover:shadow-(--dash-shadow-md)">
        <div className="mb-2 flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-(--dash-primary)/10 px-2.5 py-0.5 text-xs font-medium text-(--dash-primary)">
            {lesson.groupName}
          </span>
          <span className="text-xs text-(--dash-text-subtle)">
            {formatRelativeTime(lesson.createdAt)}
          </span>
        </div>

        <h3 className="mb-1 text-base font-semibold text-(--dash-text) group-hover:text-(--dash-primary-hover)">
          {lesson.title}
        </h3>

        <p className="mb-3 text-xs text-(--dash-text-subtle)">
          by {lesson.author.displayName ?? lesson.author.fullName ?? "Unknown"}
        </p>

        {lesson.contentMarkdown ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-(--dash-text-muted)">
            {getPreview(lesson.contentMarkdown)}
          </p>
        ) : null}

        <div className="mt-3 flex items-center gap-1 text-xs font-medium text-(--dash-primary) opacity-0 transition-opacity group-hover:opacity-100">
          Đọc tiếp
          <span className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
        </div>
      </div>
    </Link>
  );
}

export function LessonFeedCardSkeleton() {
  return (
    <div className="rounded-(--dash-radius-lg) border border-(--dash-border-subtle) bg-(--dash-glass) p-5">
      <div className="mb-2 flex items-center gap-2">
        <div className="h-5 w-16 animate-pulse rounded-full bg-(--dash-glass-active)" />
        <div className="h-4 w-12 animate-pulse rounded bg-(--dash-glass-active)" />
      </div>
      <div className="mb-2 h-5 w-3/4 animate-pulse rounded bg-(--dash-glass-active)" />
      <div className="mb-3 h-3 w-1/3 animate-pulse rounded bg-(--dash-glass-active)" />
      <div className="space-y-1.5">
        <div className="h-3 w-full animate-pulse rounded bg-(--dash-glass-active)" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-(--dash-glass-active)" />
      </div>
    </div>
  );
}
