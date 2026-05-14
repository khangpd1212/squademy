import type { LessonStatus } from "@squademy/shared";

export const STATUS_STYLES: Record<LessonStatus, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className:
      "bg-(--dash-glass) text-(--dash-text-muted)",
  },
  review: {
    label: "In Review",
    className:
      "bg-(--dash-warning)/15 text-(--dash-warning)",
  },
  published: {
    label: "Published",
    className:
      "bg-(--dash-success)/15 text-(--dash-success)",
  },
  rejected: {
    label: "Rejected",
    className:
      "bg-(--dash-danger)/15 text-(--dash-danger)",
  },
  deleted: {
    label: "Deleted",
    className:
      "bg-(--dash-danger)/15 text-(--dash-danger)",
  },
};
