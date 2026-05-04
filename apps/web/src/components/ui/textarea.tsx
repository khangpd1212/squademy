import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-24 w-full rounded-[min(var(--radius-clay),14px)] border-2 border-[oklch(0_0_0/8%)] bg-transparent shadow-(shadow-clay-inner) px-2.5 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:shadow-(shadow-clay-focus) disabled:cursor-not-allowed disabled:shadow-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
