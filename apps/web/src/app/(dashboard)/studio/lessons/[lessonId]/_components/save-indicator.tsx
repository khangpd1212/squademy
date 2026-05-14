"use client";

import { CheckCircle, Loader2, XCircle } from "lucide-react";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type SaveIndicatorProps = {
  status: SaveStatus;
};

export function SaveIndicator({ status }: SaveIndicatorProps) {
  if (status === "idle") return null;

  return (
    <span className="flex items-center gap-1 rounded-full bg-(--dash-glass) px-2 py-0.5 text-xs">
      {status === "saving" && (
        <>
          <Loader2 className="h-3 w-3 animate-spin text-(--dash-text-muted)" />
          <span className="text-(--dash-text-muted)">Saving...</span>
        </>
      )}
      {status === "saved" && (
        <>
          <CheckCircle className="h-3 w-3 text-(--dash-success)" />
          <span className="text-(--dash-success)">Saved</span>
        </>
      )}
      {status === "error" && (
        <>
          <XCircle className="h-3 w-3 text-(--dash-danger)" />
          <span className="text-(--dash-danger)">Failed to save</span>
        </>
      )}
    </span>
  );
}
