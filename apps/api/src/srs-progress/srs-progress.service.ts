import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ErrorCode } from "@squademy/shared";

interface SM2Result {
  interval: number;
  easeFactor: number;
  repetitions: number;
  nextReviewDate: Date;
}

@Injectable()
export class SrsProgressService {
  constructor(private prisma: PrismaService) {}

  async recordGrade(
    userId: string,
    data: { deckId: string; cardId: string; grade: number },
  ) {
    const deck = await this.prisma.flashcardDeck.findFirst({
      where: { id: data.deckId },
    });

    if (!deck) {
      throw new NotFoundException({ code: ErrorCode.FLASHCARD_DECK_NOT_FOUND });
    }

    const card = await this.prisma.flashcardCard.findFirst({
      where: { id: data.cardId, deckId: data.deckId },
    });

    if (!card) {
      throw new NotFoundException({ code: ErrorCode.FLASHCARD_CARD_NOT_FOUND });
    }

    const currentProgress = await this.prisma.sRSProgress.findUnique({
      where: { userId_cardId: { userId, cardId: data.cardId } },
    });

    const sm2Result = this.calculateSM2(
      currentProgress?.interval ?? 1,
      currentProgress?.easeFactor ?? 2.5,
      currentProgress?.repetitions ?? 0,
      data.grade,
    );

    const progress = await this.prisma.sRSProgress.upsert({
      where: {
        userId_cardId: {
          userId,
          cardId: data.cardId,
        },
      },
      create: {
        userId,
        deckId: data.deckId,
        cardId: data.cardId,
        grade: data.grade,
        nextReviewDate: sm2Result.nextReviewDate,
        interval: sm2Result.interval,
        easeFactor: sm2Result.easeFactor,
        repetitions: sm2Result.repetitions,
      },
      update: {
        grade: data.grade,
        nextReviewDate: sm2Result.nextReviewDate,
        interval: sm2Result.interval,
        easeFactor: sm2Result.easeFactor,
        repetitions: sm2Result.repetitions,
        lastReviewDate: new Date(),
      },
    });

    return { ok: true, data: progress };
  }

  async recordGrades(
    userId: string,
    grades: { deckId: string; cardId: string; grade: number }[],
  ) {
    const results = await this.prisma.$transaction(async (tx) => {
      const upsertPromises = grades.map(async (g) => {
        const currentProgress = await tx.sRSProgress.findUnique({
          where: { userId_cardId: { userId, cardId: g.cardId } },
        });

        const sm2Result = this.calculateSM2(
          currentProgress?.interval ?? 1,
          currentProgress?.easeFactor ?? 2.5,
          currentProgress?.repetitions ?? 0,
          g.grade,
        );

        return tx.sRSProgress.upsert({
          where: {
            userId_cardId: {
              userId,
              cardId: g.cardId,
            },
          },
          create: {
            userId,
            deckId: g.deckId,
            cardId: g.cardId,
            grade: g.grade,
            nextReviewDate: sm2Result.nextReviewDate,
            interval: sm2Result.interval,
            easeFactor: sm2Result.easeFactor,
            repetitions: sm2Result.repetitions,
          },
          update: {
            grade: g.grade,
            nextReviewDate: sm2Result.nextReviewDate,
            interval: sm2Result.interval,
            easeFactor: sm2Result.easeFactor,
            repetitions: sm2Result.repetitions,
            lastReviewDate: new Date(),
          },
        });
      });

      return Promise.all(upsertPromises);
    });

    return { ok: true, data: { count: results.length } };
  }

  async getDueCards(userId: string, deckId?: string) {
    const where: Record<string, unknown> = {
      userId,
      nextReviewDate: { lte: new Date() },
    };
    if (deckId) {
      where.deckId = deckId;
    }

    const [dueCards, allCardsInDeck] = await Promise.all([
      this.prisma.sRSProgress.findMany({
        where,
        include: {
          card: true,
          deck: { select: { id: true, title: true } },
        },
        orderBy: { nextReviewDate: "asc" },
      }),
      this.prisma.flashcardCard.findMany({
        where: {
          deckId,
        },
        include: {
          deck: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const studiedCardIds = new Set(dueCards.map((srs) => srs.cardId));

    const newCards = allCardsInDeck
      .filter((card) => !studiedCardIds.has(card.id))
      .map((card) => ({
        id: `new-${card.id}`,
        userId,
        deckId: card.deckId,
        cardId: card.id,
        grade: 0,
        nextReviewDate: new Date(),
        lastReviewDate: null,
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0,
        createdAt: card.createdAt,
        updatedAt: card.updatedAt,
        card,
        deck: { id: card.deck.id, title: card.deck.title },
      }));

    const allCards = [...newCards, ...dueCards];

    return { ok: true, data: allCards };
  }

  async getAheadCards(userId: string, deckId?: string) {
    const where: Record<string, unknown> = {
      userId,
      nextReviewDate: { gt: new Date() },
    };
    if (deckId) {
      where.deckId = deckId;
    }

    const cards = await this.prisma.sRSProgress.findMany({
      where,
      include: {
        card: true,
        deck: { select: { id: true, title: true } },
      },
      orderBy: { nextReviewDate: "asc" },
      take: 50,
    });

    return { ok: true, data: cards };
  }

  private calculateSM2(
    currentInterval: number,
    currentEaseFactor: number,
    currentRepetitions: number,
    grade: number,
  ): SM2Result {
    const q = [0, 2, 3, 5][grade] as number;

    let newEF = currentEaseFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    newEF = Math.max(1.3, newEF);

    let newInterval: number;
    let newRepetitions: number;

    if (q < 3) {
      newInterval = 1;
      newRepetitions = 0;
    } else {
      if (currentRepetitions === 0) {
        newInterval = 1;
      } else if (currentRepetitions === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.round(currentInterval * newEF);
      }
      newRepetitions = currentRepetitions + 1;
    }

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

    return {
      interval: newInterval,
      easeFactor: newEF,
      repetitions: newRepetitions,
      nextReviewDate,
    };
  }
}
