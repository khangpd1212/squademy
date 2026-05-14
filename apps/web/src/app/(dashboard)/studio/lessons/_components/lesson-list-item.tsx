import Link from "next/link";
import { Trash2 } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import {LESSON_STATUS } from "@squademy/shared";
import type { MyLessonItem } from "@/hooks/api/use-lesson-queries";
import { STATUS_STYLES } from "@/lib/status-styles";

type Props = {
  lesson: MyLessonItem;
  onDelete?: (lessonId: string) => void;
};

export function LessonListItem({ lesson, onDelete }: Props) {
  const status = STATUS_STYLES[lesson.status];

  const canDelete =
    lesson.status === LESSON_STATUS.DRAFT ||
    lesson.status === LESSON_STATUS.REJECTED;

  return (
    <Link
      href={`/studio/lessons/${lesson.id}`}
      className={cn(
        "flex w-full items-center justify-between rounded-(--dash-radius-lg) px-4 py-3 transition-colors group",
        "bg-(--dash-glass) hover:bg-(--dash-glass-hover) hover:text-(--dash-primary)",
        "border border-(--dash-border-subtle) hover:shadow-(--dash-shadow-md)"
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate font-medium">{lesson.title}</span>
        <span className="text-(--dash-text-muted) text-xs">
          {lesson.group.name}
        </span>
      </div>
      <div className="ml-4 flex shrink-0 items-center gap-3">
          <span
            className={cn(
              "inline-flex shrink-0 items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium",
              status.className,
            )}>
          {status.label}
        </span>
        <span className="text-(--dash-text-muted) text-xs">
          {formatRelativeTime(lesson.updatedAt)}
        </span>
        {canDelete && (
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-(--dash-radius) text-(--dash-danger) transition-colors hover:bg-(--dash-danger)/10"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete?.(lesson.id);
            }}>
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </Link>
  );
}
