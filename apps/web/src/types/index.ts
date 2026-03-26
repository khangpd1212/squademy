import { GROUP_ROLES, LESSON_STATUS } from "@squademy/shared";

export type UserRole = (typeof GROUP_ROLES)[keyof typeof GROUP_ROLES];

export type LessonStatus = (typeof LESSON_STATUS)[keyof typeof LESSON_STATUS];

export type ExerciseType =
  | "multiple_choice"
  | "cloze"
  | "dictation"
  | "word_definition"
  | "true_false"
  | "matching"
  | "fill_blank"
  | "paragraph_writing";

export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  disabled?: boolean;
}

export interface GroupNavItem extends NavItem {
  groupId: string;
}
