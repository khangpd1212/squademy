import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ErrorCode } from "@squademy/shared";

@Injectable()
export class FlashcardsService {
  constructor(private prisma: PrismaService) {}

  async findAllByAuthor(authorId: string) {
    const decks = await this.prisma.flashcardDeck.findMany({
      where: { authorId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        cardCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return decks.map((deck) => ({
      id: deck.id,
      title: deck.title,
      status: deck.status,
      cardCount: deck.cardCount,
      createdAt: deck.createdAt.toISOString(),
      updatedAt: deck.updatedAt.toISOString(),
    }));
  }

  async create(authorId: string, data: { title: string }) {
    const deck = await this.prisma.flashcardDeck.create({
      data: {
        title: data.title,
        authorId,
        status: "draft",
        cardCount: 0,
      },
      select: {
        id: true,
        title: true,
        status: true,
        cardCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      id: deck.id,
      title: deck.title,
      status: deck.status,
      cardCount: deck.cardCount,
      createdAt: deck.createdAt.toISOString(),
      updatedAt: deck.updatedAt.toISOString(),
    };
  }

  async findOne(deckId: string, authorId: string) {
    const deck = await this.prisma.flashcardDeck.findFirst({
      where: { id: deckId, authorId },
      include: {
        cards: {
          select: {
            id: true,
            front: true,
            back: true,
            pronunciation: true,
            audioUrl: true,
            exampleSentence: true,
            imageUrl: true,
            tags: true,
            extraNotes: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!deck) {
      throw new NotFoundException({ code: ErrorCode.FLASHCARD_DECK_NOT_FOUND });
    }

    return {
      id: deck.id,
      title: deck.title,
      status: deck.status,
      cardCount: deck.cardCount,
      createdAt: deck.createdAt.toISOString(),
      updatedAt: deck.updatedAt.toISOString(),
      cards: deck.cards.map((card) => ({
        id: card.id,
        front: card.front,
        back: card.back,
        pronunciation: card.pronunciation,
        audioUrl: card.audioUrl,
        exampleSentence: card.exampleSentence,
        imageUrl: card.imageUrl,
        tags: card.tags as string[] | null,
        extraNotes: card.extraNotes,
        createdAt: card.createdAt.toISOString(),
        updatedAt: card.updatedAt.toISOString(),
      })),
    };
  }

  async delete(deckId: string, authorId: string) {
    const deck = await this.prisma.flashcardDeck.findFirst({
      where: { id: deckId, authorId },
    });

    if (!deck) {
      throw new NotFoundException({ code: ErrorCode.FLASHCARD_DECK_NOT_FOUND });
    }

    await this.prisma.flashcardDeck.delete({
      where: { id: deckId },
    });

    return { success: true };
  }

  async addCard(
    deckId: string,
    authorId: string,
    data: {
      front: string;
      back?: string;
      pronunciation?: string;
      audioUrl?: string;
      exampleSentence?: string;
      imageUrl?: string;
      tags?: string[];
      extraNotes?: string;
    },
  ) {
    const deck = await this.prisma.flashcardDeck.findFirst({
      where: { id: deckId, authorId },
    });

    if (!deck) {
      throw new NotFoundException({ code: ErrorCode.FLASHCARD_DECK_NOT_FOUND });
    }

    const [card] = await this.prisma.$transaction([
      this.prisma.flashcardCard.create({
        data: {
          deckId,
          front: data.front,
          back: data.back ?? null,
          pronunciation: data.pronunciation ?? null,
          audioUrl: data.audioUrl ?? null,
          exampleSentence: data.exampleSentence ?? null,
          imageUrl: data.imageUrl ?? null,
          tags: data.tags,
          extraNotes: data.extraNotes ?? null,
        },
        select: {
          id: true,
          front: true,
          back: true,
          pronunciation: true,
          audioUrl: true,
          exampleSentence: true,
          imageUrl: true,
          tags: true,
          extraNotes: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.flashcardDeck.update({
        where: { id: deckId },
        data: { cardCount: { increment: 1 } },
      }),
    ]);

    return {
      id: card.id,
      front: card.front,
      back: card.back,
      pronunciation: card.pronunciation,
      audioUrl: card.audioUrl,
      exampleSentence: card.exampleSentence,
      imageUrl: card.imageUrl,
      tags: card.tags as string[] | null,
      extraNotes: card.extraNotes,
      createdAt: card.createdAt.toISOString(),
      updatedAt: card.updatedAt.toISOString(),
    };
  }

  async importAnki(
    authorId: string,
    data: {
      title: string;
      cards: {
        front: string;
        back?: string;
        pronunciation?: string;
        audioUrl?: string;
        exampleSentence?: string;
        imageUrl?: string;
        tags?: string[];
        extraNotes?: string;
      }[];
    },
  ) {
    if (!data.cards || data.cards.length === 0) {
      throw new BadRequestException({
        code: ErrorCode.FLASHCARD_IMPORT_FAILED,
        message: "No cards to import.",
      });
    }

    const deck = await this.prisma.flashcardDeck.create({
      data: {
        title: data.title,
        authorId,
        status: "draft",
        cardCount: data.cards.length,
        cards: {
          create: data.cards.map((card) => ({
            front: card.front,
            back: card.back ?? null,
            pronunciation: card.pronunciation ?? null,
            audioUrl: card.audioUrl ?? null,
            exampleSentence: card.exampleSentence ?? null,
            imageUrl: card.imageUrl ?? null,
            tags: card.tags,
            extraNotes: card.extraNotes ?? null,
          })),
        },
      },
      select: {
        id: true,
        title: true,
        status: true,
        cardCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      id: deck.id,
      title: deck.title,
      status: deck.status,
      cardCount: deck.cardCount,
      createdAt: deck.createdAt.toISOString(),
      updatedAt: deck.updatedAt.toISOString(),
    };
  }
}