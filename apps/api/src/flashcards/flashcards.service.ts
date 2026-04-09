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

  async findAllByGroup(groupId: string) {
    const decks = await this.prisma.flashcardDeck.findMany({
      where: {
        learningPathItems: {
          some: {
            groupId,
          },
        },
        status: "published",
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        cardCount: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });

    return decks.map((deck) => ({
      id: deck.id,
      title: deck.title,
      description: deck.description,
      cardCount: deck.cardCount,
      updatedAt: deck.updatedAt.toISOString(),
      author: {
        id: deck.author.id,
        displayName: deck.author.displayName,
      },
    }));
  }

  async create(authorId: string, data: { title: string; description?: string; groupIds?: string[] }) {
    const deck = await this.prisma.flashcardDeck.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        authorId,
        status: "draft",
        cardCount: 0,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        cardCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (data.groupIds && data.groupIds.length > 0) {
      const maxSortOrder = await this.prisma.learningPathItem.findFirst({
        where: { groupId: { in: data.groupIds } },
        orderBy: { sortOrder: "desc" },
      });
      let sortOrder = (maxSortOrder?.sortOrder ?? -1) + 1;

      await this.prisma.learningPathItem.createMany({
        data: data.groupIds.map((groupId) => ({
          groupId,
          deckId: deck.id,
          sortOrder: sortOrder++,
        })),
      });
    }

    return {
      id: deck.id,
      title: deck.title,
      description: deck.description,
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

  async publishDeck(deckId: string, authorId: string) {
    const deck = await this.prisma.flashcardDeck.findFirst({
      where: { id: deckId, authorId },
    });

    if (!deck) {
      throw new NotFoundException({ code: ErrorCode.FLASHCARD_DECK_NOT_FOUND });
    }

    if (deck.cardCount === 0) {
      throw new BadRequestException({
        code: ErrorCode.FLASHCARD_EMPTY_DECK,
        message: "Cannot publish an empty deck.",
      });
    }

    const updated = await this.prisma.flashcardDeck.update({
      where: { id: deckId },
      data: { status: "published" },
      select: {
        id: true,
        title: true,
        status: true,
        cardCount: true,
        updatedAt: true,
      },
    });

    return {
      id: updated.id,
      title: updated.title,
      status: updated.status,
      cardCount: updated.cardCount,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async addToGroup(deckId: string, groupId: string, authorId: string) {
    const deck = await this.prisma.flashcardDeck.findFirst({
      where: { id: deckId, authorId },
    });

    if (!deck) {
      throw new NotFoundException({ code: ErrorCode.FLASHCARD_DECK_NOT_FOUND });
    }

    const lastItem = await this.prisma.learningPathItem.findFirst({
      where: { groupId },
      orderBy: { sortOrder: "desc" },
    });
    const nextSortOrder = (lastItem?.sortOrder ?? -1) + 1;

    const item = await this.prisma.learningPathItem.create({
      data: {
        groupId,
        deckId,
        sortOrder: nextSortOrder,
      },
      include: {
        deck: { select: { id: true, title: true, status: true } },
      },
    });

    return item;
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
      groupIds?: string[];
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
        description: true,
        status: true,
        cardCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (data.groupIds && data.groupIds.length > 0) {
      const maxSortOrder = await this.prisma.learningPathItem.findFirst({
        where: { groupId: { in: data.groupIds } },
        orderBy: { sortOrder: "desc" },
      });
      let sortOrder = (maxSortOrder?.sortOrder ?? -1) + 1;

      await this.prisma.learningPathItem.createMany({
        data: data.groupIds.map((groupId) => ({
          groupId,
          deckId: deck.id,
          sortOrder: sortOrder++,
        })),
      });
    }

    return {
      id: deck.id,
      title: deck.title,
      description: deck.description,
      status: deck.status,
      cardCount: deck.cardCount,
      createdAt: deck.createdAt.toISOString(),
      updatedAt: deck.updatedAt.toISOString(),
    };
  }
}