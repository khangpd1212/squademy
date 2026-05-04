"use client";

import { cn } from "@/lib/utils";

const STATUS_STYLES = {
    draft: {
      label: "Draft",
      className: "bg-(clay-surface-3) text-muted-foreground shadow-(shadow-clay-pressed)",
    },
    review: {
      label: "In Review",
      className:
        "bg-(clay-warning)/20 text-(clay-warning-foreground)",
    },
    published: {
      label: "Published",
      className:
        "bg-(clay-success)/20 text-(clay-success-foreground)",
    },
    rejected: {
      label: "Rejected",
      className: "bg-(clay-error)/20 text-(clay-error-foreground)",
    },
    deleted: {
      label: "Deleted",
      className: "bg-(clay-error)/20 text-(clay-error-foreground)",
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
