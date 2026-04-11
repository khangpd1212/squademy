import { z } from "zod";
import { VALIDATION } from "../constants";

export const createDeckSchema = z.object({
  title: z
    .string()
    .min(VALIDATION.DISPLAY_NAME_MIN)
    .max(100),
});
export type CreateDeckInput = z.infer<typeof createDeckSchema>;

export const createCardSchema = z.object({
  front: z.string().min(1),
  back: z.string().optional().nullable(),
  pronunciation: z.string().optional().nullable(),
  exampleSentence: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  extraNotes: z.string().optional().nullable(),
});
export type CreateCardInput = z.infer<typeof createCardSchema>;

export const importAnkiDeckSchema = z.object({
  title: z.string().min(VALIDATION.DISPLAY_NAME_MIN).max(100),
  cards: z.array(createCardSchema).min(1),
});
export type ImportAnkiDeckInput = z.infer<typeof importAnkiDeckSchema>;

export const flashcardDeckSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string(),
  cardCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type FlashcardDeck = z.infer<typeof flashcardDeckSchema>;

export const flashcardCardSchema = z.object({
  id: z.string(),
  front: z.string(),
  back: z.string().nullable(),
  pronunciation: z.string().nullable(),
  audioUrl: z.string().nullable(),
  exampleSentence: z.string().nullable(),
  imageUrl: z.string().nullable(),
  tags: z.array(z.string()).nullable(),
  extraNotes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type FlashcardCard = z.infer<typeof flashcardCardSchema>;

export const flashcardDeckDetailSchema = flashcardDeckSchema.extend({
  cards: z.array(flashcardCardSchema),
});
export type FlashcardDeckDetail = z.infer<typeof flashcardDeckDetailSchema>;

export const srsGradeSchema = z.object({
  deckId: z.string(),
  cardId: z.string(),
  grade: z.number().min(0).max(1),
  createdAt: z.number().optional(),
});
export type SrsGradeInput = z.infer<typeof srsGradeSchema>;

export const srsGradeBatchSchema = z.object({
  grades: z.array(srsGradeSchema),
});
export type SrsGradeBatchInput = z.infer<typeof srsGradeBatchSchema>;