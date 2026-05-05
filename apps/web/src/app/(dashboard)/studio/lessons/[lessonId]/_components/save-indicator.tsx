"use client";

import { CheckCircle, Loader2, XCircle } from "lucide-react";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type SaveIndicatorProps = {
  status: SaveStatus;
};

export function SaveIndicator({ status }: SaveIndicatorProps) {
  if (status === "idle") return null;

  return (
    <span className="flex items-center gap-1 clay-pill text-xs px-2 py-0.5">
      {status === "saving" && (
        <>
          <Loader2 className="h-3 w-3 animate-spin text-(--clay-muted-foreground)" />
          <span className="text-(--clay-muted-foreground)">Saving...</span>
        </>
      )}
      {status === "saved" && (
        <>
          <CheckCircle className="h-3 w-3 text-(--clay-success-foreground)" />
          <span className="text-(--clay-success-foreground)">Saved</span>
        </>
      )}
      {status === "error" && (
        <>
          <XCircle className="h-3 w-3 text-(--clay-error-foreground)" />
          <span className="text-(--clay-error-foreground)">Failed to save</span>
        </>
      )}
    </span>
  );
}
