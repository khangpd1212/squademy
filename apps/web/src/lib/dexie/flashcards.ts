import Dexie, { type EntityTable } from "dexie";
import type { FlashcardCardItem } from "@/types/flashcard";
import type { CachedDeck, GradeQueueItem } from "@/types/flashcard";

class FlashcardDatabase extends Dexie {
  decks!: EntityTable<CachedDeck, "id">;
  gradeQueue!: EntityTable<GradeQueueItem, keyof GradeQueueItem>;

  constructor() {
    super("FlashcardDB");
    this.version(1).stores({
      decks: "id",
      gradeQueue: "++id, deckId, cardId, createdAt",
    });
  }
}

export const flashcardDb = new FlashcardDatabase();

export async function getCachedDeck(deckId: string): Promise<CachedDeck | undefined> {
  return flashcardDb.decks.get(deckId);
}

export async function cacheDeck(
  deckId: string,
  cards: FlashcardCardItem[],
): Promise<void> {
  await flashcardDb.decks.put({
    id: deckId,
    cards,
    cachedAt: Date.now(),
  });
}

export async function getOfflineCards(
  deckId: string,
): Promise<FlashcardCardItem[] | undefined> {
  const cached = await getCachedDeck(deckId);
  return cached?.cards;
}

export async function addToGradeQueue(
  deckId: string,
  cardId: string,
  grade: number,
  srsValues?: { easeFactor: number; interval: number; repetitions: number },
): Promise<void> {
  await flashcardDb.gradeQueue.add({
    deckId,
    cardId,
    grade,
    createdAt: Date.now(),
    ...(srsValues ?? {}),
  });
}

export async function getGradeQueue(): Promise<GradeQueueItem[]> {
  return flashcardDb.gradeQueue.toArray();
}

export async function clearGradeQueue(ids: number[]): Promise<void> {
  await flashcardDb.gradeQueue.bulkDelete(ids);
}

export async function getPendingGradeCount(): Promise<number> {
  return flashcardDb.gradeQueue.count();
}