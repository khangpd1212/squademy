"use client";

import { cn } from "@/lib/utils";

const STATUS_STYLES = {
    draft: {
      label: "Draft",
      className: "bg-(--dash-surface-elevated) text-(--dash-text-muted)",
    },
    review: {
      label: "In Review",
      className:
        "bg-(--dash-warning)/20 text-(--dash-warning)",
    },
    published: {
      label: "Published",
      className:
        "bg-(--dash-success)/20 text-(--dash-success)",
    },
    rejected: {
      label: "Rejected",
      className: "bg-(--dash-danger)/20 text-(--dash-danger)",
    },
    deleted: {
      label: "Deleted",
      className: "bg-(--dash-danger)/20 text-(--dash-danger)",
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
