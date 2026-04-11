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

export * from "./flashcard";
