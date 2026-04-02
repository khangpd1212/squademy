"use client";

import { CheckCircle, Loader2, XCircle } from "lucide-react";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type SaveIndicatorProps = {
  status: SaveStatus;
};

export function SaveIndicator({ status }: SaveIndicatorProps) {
  if (status === "idle") return null;

  return (
    <span className="flex items-center gap-1 text-xs">
      {status === "saving" && (
        <>
          <Loader2 className="h-3 w-3 animate-spin text-zinc-400" />
          <span className="text-zinc-400">Saving...</span>
        </>
      )}
      {status === "saved" && (
        <>
          <CheckCircle className="h-3 w-3 text-green-500" />
          <span className="text-green-600 dark:text-green-400">Saved</span>
        </>
      )}
      {status === "error" && (
        <>
          <XCircle className="h-3 w-3 text-red-500" />
          <span className="text-red-500">Failed to save</span>
        </>
      )}
    </span>
  );
}
