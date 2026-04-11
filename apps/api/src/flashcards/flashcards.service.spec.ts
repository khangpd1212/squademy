import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FlashcardsService } from "./flashcards.service";

describe("FlashcardsService", () => {
  let service: FlashcardsService;
  let prisma: {
    flashcardDeck: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    flashcardCard: {
      create: jest.Mock;
    };
    learningPathItem: {
      findMany: jest.Mock;
      delete: jest.Mock;
      createMany: jest.Mock;
    };
    groupMember: {
      findMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      flashcardDeck: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      flashcardCard: {
        create: jest.fn(),
      },
      learningPathItem: {
        findMany: jest.fn(),
        delete: jest.fn(),
        createMany: jest.fn(),
      },
      groupMember: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn(async (callback) => callback(prisma)),
    };

    service = new FlashcardsService(prisma as unknown as PrismaService);
  });

  describe("findAllByAuthor", () => {
    it("returns decks for author", async () => {
      prisma.flashcardDeck.findMany.mockResolvedValue([
        {
          id: "deck-1",
          title: "Test Deck",
          status: "draft",
          cardCount: 10,
          createdAt: new Date("2026-01-01"),
          updatedAt: new Date("2026-01-01"),
        },
      ]);

      const result = await service.findAllByAuthor("user-1");

      expect(prisma.flashcardDeck.findMany).toHaveBeenCalledWith({
        where: { authorId: "user-1" },
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
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Test Deck");
    });
  });

  describe("create", () => {
    it("creates a new deck", async () => {
      prisma.flashcardDeck.create.mockResolvedValue({
        id: "deck-1",
        title: "New Deck",
        description: null,
        status: "draft",
        cardCount: 0,
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
      });

      const result = await service.create("user-1", { title: "New Deck" });

      expect(prisma.flashcardDeck.create).toHaveBeenCalledWith({
        data: {
          title: "New Deck",
          description: null,
          authorId: "user-1",
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
      expect(result.title).toBe("New Deck");
      expect(result.status).toBe("draft");
    });
  });

  describe("findOne", () => {
    it("returns deck with cards", async () => {
      prisma.flashcardDeck.findFirst.mockResolvedValue({
        id: "deck-1",
        title: "Test Deck",
        status: "draft",
        cardCount: 2,
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
        cards: [
          {
            id: "card-1",
            front: "Hello",
            back: "Xin chào",
            pronunciation: "/sin tjɑːu/",
            audioUrl: null,
            exampleSentence: null,
            imageUrl: null,
            tags: ["greeting"],
            extraNotes: null,
            createdAt: new Date("2026-01-01"),
            updatedAt: new Date("2026-01-01"),
          },
        ],
      });

      const result = await service.findOne("deck-1", "user-1");

      expect(result.id).toBe("deck-1");
      expect(result.cards).toHaveLength(1);
      expect(result.cards[0].front).toBe("Hello");
    });

    it("throws NotFoundException when deck not found", async () => {
      prisma.flashcardDeck.findFirst.mockResolvedValue(null);

      await expect(service.findOne("deck-1", "user-1")).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("delete", () => {
    it("deletes deck", async () => {
      prisma.flashcardDeck.findFirst.mockResolvedValue({ id: "deck-1" });
      prisma.flashcardDeck.delete.mockResolvedValue({ id: "deck-1" });

      const result = await service.delete("deck-1", "user-1");

      expect(prisma.flashcardDeck.delete).toHaveBeenCalledWith({
        where: { id: "deck-1" },
      });
      expect(result.success).toBe(true);
    });

    it("throws NotFoundException when deck not found", async () => {
      prisma.flashcardDeck.findFirst.mockResolvedValue(null);

      await expect(service.delete("deck-1", "user-1")).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("addCard", () => {
    it("adds card and increments cardCount", async () => {
      prisma.flashcardDeck.findFirst.mockResolvedValue({ id: "deck-1" });
      
      // Mock transaction to return the card
      const mockCard = {
        id: "card-1",
        front: "Test",
        back: "Test VN",
        pronunciation: null,
        audioUrl: null,
        exampleSentence: null,
        imageUrl: null,
        tags: null,
        extraNotes: null,
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
      };
      
      prisma.$transaction = jest.fn().mockResolvedValue([mockCard, {}]);

      const result = await service.addCard("deck-1", "user-1", {
        front: "Test",
        back: "Test VN",
      });

      expect(result.front).toBe("Test");
      expect(result.back).toBe("Test VN");
    });

    it("throws NotFoundException when deck not found", async () => {
      prisma.flashcardDeck.findFirst.mockResolvedValue(null);

      await expect(
        service.addCard("deck-1", "user-1", { front: "Test" })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("getDeckGroups", () => {
    it("returns groups where deck is published", async () => {
      prisma.learningPathItem.findMany.mockResolvedValue([
        { groupId: "group-1", group: { id: "group-1", name: "Group A" } },
        { groupId: "group-2", group: { id: "group-2", name: "Group B" } },
      ]);

      const result = await service.getDeckGroups("deck-1");

      expect(result).toHaveLength(2);
      expect(result[0].groupName).toBe("Group A");
    });
  });

  describe("updatePublishGroups", () => {
    it("publishes deck to groups when user is editor", async () => {
      // Setup
      prisma.flashcardDeck.findFirst.mockResolvedValue({ id: "deck-1", cardCount: 5 });
      prisma.groupMember.findMany.mockResolvedValue([
        { groupId: "group-1" },
        { groupId: "group-2" },
      ]);
      prisma.learningPathItem.findMany.mockResolvedValue([]);
      prisma.$transaction.mockImplementation(async () => {});

      const result = await service.updatePublishGroups("deck-1", "user-1", [
        "group-1",
        "group-2",
      ]);

      expect(result.added).toBe(2);
      expect(result.published).toBe(true);
    });

    it("throws BadRequestException when publishing empty deck", async () => {
      prisma.flashcardDeck.findFirst.mockResolvedValue({ id: "deck-1", cardCount: 0 });

      await expect(
        service.updatePublishGroups("deck-1", "user-1", ["group-1"])
      ).rejects.toThrow(BadRequestException);
    });

    it("throws ForbiddenException when user is not editor", async () => {
      prisma.flashcardDeck.findFirst.mockResolvedValue({ id: "deck-1", cardCount: 5 });
      prisma.groupMember.findMany.mockResolvedValue([]); // No editor membership

      await expect(
        service.updatePublishGroups("deck-1", "user-1", ["group-1"])
      ).rejects.toThrow(ForbiddenException);
    });

    it("unpublishes deck when removing all groups", async () => {
      prisma.flashcardDeck.findFirst.mockResolvedValue({
        id: "deck-1",
        cardCount: 5,
        status: "published",
      });
      prisma.groupMember.findMany.mockResolvedValue([]); // No new groups
      prisma.learningPathItem.findMany.mockResolvedValue([
        { groupId: "group-1" },
      ]);
      prisma.$transaction.mockImplementation(async () => {});

      const result = await service.updatePublishGroups("deck-1", "user-1", []);

      expect(result.removed).toBe(1);
      expect(result.published).toBe(false);
    });

    it("throws NotFoundException when deck not found", async () => {
      prisma.flashcardDeck.findFirst.mockResolvedValue(null);

      await expect(
        service.updatePublishGroups("deck-1", "user-1", [])
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("importAnki", () => {
    it("imports deck with cards", async () => {
      prisma.flashcardDeck.create.mockResolvedValue({
        id: "deck-1",
        title: "Imported Deck",
        description: null,
        status: "draft",
        cardCount: 2,
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
      });

      const result = await service.importAnki("user-1", {
        title: "Imported Deck",
        cards: [
          { front: "Hello", back: "Xin chào" },
          { front: "World", back: "Thế giới" },
        ],
      });

      expect(result.title).toBe("Imported Deck");
      expect(result.cardCount).toBe(2);
    });

    it("throws BadRequestException when no cards", async () => {
      await expect(
        service.importAnki("user-1", { title: "Empty", cards: [] })
      ).rejects.toThrow(BadRequestException);
    });
  });
});