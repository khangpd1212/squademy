import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ErrorCode } from "@squademy/shared";

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
        nextReviewDate: this.calculateNextReview(data.grade),
        interval: 1,
        easeFactor: 2.5,
      },
      update: {
        grade: data.grade,
        nextReviewDate: this.calculateNextReview(data.grade),
        interval: this.calculateInterval(data.grade),
        easeFactor: this.calculateEase(data.grade),
        lastReviewDate: new Date(),
      },
    });

    return { ok: true, data: progress };
  }

  async recordGrades(
    userId: string,
    grades: { deckId: string; cardId: string; grade: number }[],
  ) {
    const results = await this.prisma.$transaction(
      grades.map((g) =>
        this.prisma.sRSProgress.upsert({
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
            nextReviewDate: this.calculateNextReview(g.grade),
            interval: 1,
            easeFactor: 2.5,
          },
          update: {
            grade: g.grade,
            nextReviewDate: this.calculateNextReview(g.grade),
            interval: this.calculateInterval(g.grade),
            easeFactor: this.calculateEase(g.grade),
            lastReviewDate: new Date(),
          },
        }),
      ),
    );

    return { ok: true, data: { count: results.length } };
  }

  private calculateNextReview(grade: number): Date {
    const now = new Date();
    if (grade === 0) {
      now.setDate(now.getDate() + 1);
    } else {
      now.setDate(now.getDate() + 3);
    }
    return now;
  }

  private calculateInterval(grade: number): number {
    return grade === 0 ? 1 : 3;
  }

  private calculateEase(grade: number): number {
    return grade === 0 ? 2.0 : 2.5;
  }
}