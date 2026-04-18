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