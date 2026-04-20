"use client";

import { cn } from "@/lib/utils";

const STATUS_STYLES = {
  draft: {
    label: "Draft",
    className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
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
    className: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  },
  deleted: {
    label: "Deleted",
    className: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  },
} as const;

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusStyle = STATUS_STYLES[status as keyof typeof STATUS_STYLES];

  if (!statusStyle) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium",
        statusStyle.className,
        className,
      )}>
      {statusStyle.label}
    </span>
  );
}
