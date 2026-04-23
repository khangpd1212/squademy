import Dexie, { type EntityTable } from "dexie";
import type { FlashcardCardItem, PersonalDeck, PersonalCard } from "@/types/flashcard";
import type { CachedDeck, GradeQueueItem } from "@/types/flashcard";

class FlashcardDatabase extends Dexie {
  decks!: EntityTable<CachedDeck, "id">;
  personalDecks!: EntityTable<PersonalDeck, "id">;
  gradeQueue!: EntityTable<GradeQueueItem, keyof GradeQueueItem>;

  constructor() {
    super("FlashcardDB");
    this.version(2).stores({
      decks: "id",
      personalDecks: "id, sourceId",
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

export async function getPersonalDeck(sourceId: string): Promise<PersonalDeck | undefined> {
  return flashcardDb.personalDecks.get(`${sourceId}_personal`);
}

export async function createPersonalDeck(
  sourceId: string,
  source: Record<string, unknown>[],
  title: string,
  sourceVersion: number = 1,
): Promise<PersonalDeck> {
  const personalDeck: PersonalDeck = {
    id: `${sourceId}_personal`,
    sourceId,
    title,
    cards: source.map((card: Record<string, unknown>) => ({
      id: String(card.id),
      sourceId: String(card.id),
      front: String(card.front || ""),
      back: String(card.back || ""),
      ipa: card.ipa ? String(card.ipa) : undefined,
      tags: Array.isArray(card.tags) ? card.tags.filter((t): t is string => typeof t === "string") : [],
      customNotes: "",
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReview: 0,
    })),
    sourceVersion,
    syncedAt: Date.now(),
  };

  await flashcardDb.personalDecks.put(personalDeck);
  return personalDeck;
}

export async function updatePersonalCard(
  deckId: string,
  cardId: string,
  updates: Partial<Pick<PersonalCard, "front" | "back" | "ipa" | "tags" | "customNotes">>,
): Promise<void> {
  const deck = await flashcardDb.personalDecks.get(deckId);
  if (!deck) return;

  const cardIndex = deck.cards.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) return;

  deck.cards[cardIndex] = { ...deck.cards[cardIndex], ...updates };
  await flashcardDb.personalDecks.put(deck);
}

export async function autoMergePersonalDeck(
  sourceId: string,
  sourceCards: Record<string, unknown>[],
  newVersion: number,
): Promise<PersonalDeck | undefined> {
  const deckId = `${sourceId}_personal`;
  const deck = await flashcardDb.personalDecks.get(deckId);
  if (!deck || newVersion <= deck.sourceVersion) return deck;

  const mergedCards = sourceCards.map((sc: Record<string, unknown>): PersonalCard => {
    const existing = deck.cards.find((c) => c.sourceId === String(sc.id));
    return {
      id: String(sc.id),
      sourceId: String(sc.id),
      front: String(sc.front || ""),
      back: String(sc.back || ""),
      ipa: sc.ipa ? String(sc.ipa) : undefined,
      tags: Array.isArray(sc.tags) ? sc.tags.filter((t): t is string => typeof t === "string") : [],
      customNotes: existing?.customNotes ?? "",
      easeFactor: existing?.easeFactor ?? 2.5,
      interval: existing?.interval ?? 0,
      repetitions: existing?.repetitions ?? 0,
      nextReview: existing?.nextReview ?? 0,
    };
  });

  const updated = {
    ...deck,
    cards: mergedCards,
    sourceVersion: newVersion,
    syncedAt: Date.now(),
  };

  await flashcardDb.personalDecks.put(updated);
  return updated;
}