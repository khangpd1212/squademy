"use client";

import { type LucideIcon } from "lucide-react";

export type EmptyProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function Empty({
  icon: Icon,
  title,
  description,
  action,
}: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-8 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-semibold">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
