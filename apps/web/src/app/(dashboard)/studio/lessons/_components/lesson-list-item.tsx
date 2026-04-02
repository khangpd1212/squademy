import Link from "next/link";
import type { LessonStatus } from "@squademy/shared";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { MyLessonItem } from "@/hooks/api/use-lesson-queries";

const STATUS_STYLES: Record<LessonStatus, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className:
      "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  },
  review: {
    label: "In Review",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  },
  published: {
    label: "Published",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  rejected: {
    label: "Rejected",
    className:
      "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  },
};

type Props = {
  lesson: MyLessonItem;
};

export function LessonListItem({ lesson }: Props) {
  const status = STATUS_STYLES[lesson.status] ?? {
    label: lesson.status,
    className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  };

  return (
    <Link
      href={`/studio/lessons/${lesson.id}`}
      className="group flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate font-medium">{lesson.title}</span>
        <span className="text-xs text-muted-foreground">{lesson.group.name}</span>
      </div>
      <div className="ml-4 flex shrink-0 items-center gap-3">
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-medium",
            status.className,
          )}
        >
          {status.label}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatRelativeTime(lesson.updatedAt)}
        </span>
      </div>
    </Link>
  );
}
