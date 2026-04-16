import { Test, TestingModule } from "@nestjs/testing";
import { FlashcardsController } from "./flashcards.controller";
import { FlashcardsService } from "./flashcards.service";
import { JwtPayload } from "../common/decorators/current-user.decorator";

const mockUser: JwtPayload = { userId: "user-1", email: "test@example.com" };

describe("FlashcardsController", () => {
  let controller: FlashcardsController;
  let service: {
    findAllByAuthor: jest.Mock;
    create: jest.Mock;
    findOne: jest.Mock;
    delete: jest.Mock;
    addCard: jest.Mock;
    getDeckGroups: jest.Mock;
    updatePublishGroups: jest.Mock;
    importAnki: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      findAllByAuthor: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
      addCard: jest.fn(),
      getDeckGroups: jest.fn(),
      updatePublishGroups: jest.fn(),
      importAnki: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FlashcardsController],
      providers: [
        {
          provide: FlashcardsService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<FlashcardsController>(FlashcardsController);
  });

  describe("findAll", () => {
    it("returns all decks for user", async () => {
      service.findAllByAuthor.mockResolvedValue([
        { id: "deck-1", title: "Deck 1", status: "draft", cardCount: 5 },
      ]);

      const result = await controller.findAll({ userId: "user-1", email: "test@example.com" });

      expect(service.findAllByAuthor).toHaveBeenCalledWith("user-1");
      expect(result.ok).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe("create", () => {
    it("creates a new deck", async () => {
      service.create.mockResolvedValue({
        id: "deck-1",
        title: "New Deck",
        status: "draft",
        cardCount: 0,
      });

      const result = await controller.create(
        mockUser,
        { title: "New Deck" }
      );

      expect(service.create).toHaveBeenCalledWith("user-1", { title: "New Deck" });
      expect(result.ok).toBe(true);
      expect(result.data.title).toBe("New Deck");
    });
  });

  describe("findOne", () => {
    it("returns deck details", async () => {
      service.findOne.mockResolvedValue({
        id: "deck-1",
        title: "Test Deck",
        status: "draft",
        cardCount: 3,
        cards: [],
      });

      const result = await controller.findOne("deck-1");

      expect(service.findOne).toHaveBeenCalledWith("deck-1");
      expect(result.ok).toBe(true);
      expect(result.data.id).toBe("deck-1");
    });
  });

  describe("delete", () => {
    it("deletes deck", async () => {
      service.delete.mockResolvedValue({ success: true });

      const result = await controller.delete("deck-1", mockUser);

      expect(service.delete).toHaveBeenCalledWith("deck-1", "user-1");
      expect(result.ok).toBe(true);
      expect(result.data.success).toBe(true);
    });
  });

  describe("addCard", () => {
    it("adds card to deck", async () => {
      service.addCard.mockResolvedValue({
        id: "card-1",
        front: "Hello",
        back: "Xin chào",
      });

      const result = await controller.addCard(
        "deck-1",
        mockUser,
        { front: "Hello", back: "Xin chào" }
      );

      expect(service.addCard).toHaveBeenCalledWith("deck-1", "user-1", {
        front: "Hello",
        back: "Xin chào",
      });
      expect(result.ok).toBe(true);
      expect(result.data.front).toBe("Hello");
    });
  });

  describe("getDeckGroups", () => {
    it("returns groups where deck is published", async () => {
      service.getDeckGroups.mockResolvedValue([
        { groupId: "group-1", groupName: "Group A" },
      ]);

      const result = await controller.getDeckGroups("deck-1");

      expect(service.getDeckGroups).toHaveBeenCalledWith("deck-1");
      expect(result.ok).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe("updatePublishGroups", () => {
    it("updates publish groups", async () => {
      service.updatePublishGroups.mockResolvedValue({
        added: 1,
        removed: 0,
        published: true,
      });

      const result = await controller.updatePublishGroups(
        "deck-1",
        mockUser,
        { groupIds: ["group-1"] }
      );

      expect(service.updatePublishGroups).toHaveBeenCalledWith("deck-1", "user-1", [
        "group-1",
      ]);
      expect(result.ok).toBe(true);
      expect(result.data.published).toBe(true);
    });
  });

  describe("importAnki", () => {
    it("imports Anki deck", async () => {
      service.importAnki.mockResolvedValue({
        id: "deck-1",
        title: "Imported Deck",
        status: "draft",
        cardCount: 10,
      });

      const result = await controller.importAnki(
        mockUser,
        {
          title: "Imported Deck",
          cards: [{ front: "Test", back: "Test" }],
        }
      );

      expect(service.importAnki).toHaveBeenCalled();
      expect(result.ok).toBe(true);
    });
  });
});