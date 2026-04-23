import {
  FlashcardCard,
  FlashcardDeck,
  FlashcardDeckDetail,
  CreateDeckInput,
  CreateCardInput,
  ImportAnkiDeckInput,
  SrsGradeInput,
  SrsGradeBatchInput,
} from "@squademy/shared";

export type {
  FlashcardCard,
  FlashcardDeck,
  FlashcardDeckDetail,
  CreateDeckInput,
  CreateCardInput,
  ImportAnkiDeckInput,
  SrsGradeInput,
  SrsGradeBatchInput,
};

export type FlashcardCardItem = FlashcardCard;
export type FlashcardDeckItem = FlashcardDeck;
export type FlashcardDeckDetailItem = FlashcardDeckDetail;

export interface CachedDeck {
  id: string;
  cards: FlashcardCardItem[];
  cachedAt: number;
}

export interface GradeQueueItem {
  id?: number;
  deckId: string;
  cardId: string;
  grade: number;
  createdAt: number;
  easeFactor?: number;
  interval?: number;
  repetitions?: number;
}

export interface PersonalDeck {
  id: string;
  sourceId: string;
  title: string;
  cards: PersonalCard[];
  sourceVersion: number;
  syncedAt: number;
}

export interface PersonalCard {
  id: string;
  sourceId: string | null;
  front: string | null;
  back: string | null;
  ipa?: string | null;
  tags?: string[] | null;
  customNotes: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: number;
}