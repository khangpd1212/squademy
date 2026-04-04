import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatRelativeTime } from "@/lib/utils";
import { STATUS_STYLES } from "@/lib/status-styles";
import type { MyLessonItem } from "@/hooks/api/use-lesson-queries";
import { LESSON_STATUS } from "@squademy/shared";

type Props = {
  lesson: MyLessonItem;
  onDelete?: (lessonId: string) => void;
};

export function LessonListItem({ lesson, onDelete }: Props) {
  const status = STATUS_STYLES[lesson.status] ?? {
    label: lesson.status,
    className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  };

  const canDelete =
    lesson.status === LESSON_STATUS.DRAFT ||
    lesson.status === LESSON_STATUS.REJECTED;

  return (
    <Link
      href={`/studio/lessons/${lesson.id}`}
      className="group flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-accent hover:text-accent-foreground">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate font-medium">{lesson.title}</span>
        <span className="text-xs text-muted-foreground">
          {lesson.group.name}
        </span>
      </div>
      <div className="ml-4 flex shrink-0 items-center gap-3">
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-medium",
            status.className,
          )}>
          {status.label}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatRelativeTime(lesson.updatedAt)}
        </span>
        {canDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete?.(lesson.id);
            }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Link>
  );
}
