"use client";

import { STATUS_STYLES } from "@/lib/status-styles";
import { cn } from "@/lib/utils";

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
