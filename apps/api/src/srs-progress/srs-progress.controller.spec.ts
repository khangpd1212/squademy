import { Test, TestingModule } from "@nestjs/testing";
import { SrsProgressController } from "./srs-progress.controller";
import { SrsProgressService } from "./srs-progress.service";

describe("SrsProgressController", () => {
  let controller: SrsProgressController;
  let service: SrsProgressService;

  const mockUser = { userId: "user-123", email: "test@example.com" };

  const mockSrsProgress = [
    {
      id: "srs-1",
      userId: "user-123",
      deckId: "deck-1",
      cardId: "card-1",
      grade: 2,
      nextReviewDate: new Date("2026-04-15"),
      lastReviewDate: new Date("2026-04-10"),
      interval: 1,
      easeFactor: 2.5,
      repetitions: 1,
      card: { id: "card-1", front: "front", back: "back" },
      deck: { id: "deck-1", title: "Deck 1" },
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SrsProgressController],
      providers: [
        {
          provide: SrsProgressService,
          useValue: {
            getDueCards: jest.fn(),
            getAheadCards: jest.fn(),
            recordGrade: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SrsProgressController>(SrsProgressController);
    service = module.get<SrsProgressService>(SrsProgressService);
  });

  describe("getDueCards", () => {
    it("should return due cards for user", async () => {
      (service.getDueCards as jest.Mock).mockResolvedValue({
        ok: true,
        data: mockSrsProgress,
      });

      const result = await controller.getDueCards(mockUser, "deck-1");

      expect(service.getDueCards).toHaveBeenCalledWith("user-123", "deck-1");
      expect(result.ok).toBe(true);
      expect(result.data).toEqual(mockSrsProgress);
    });

    it("should return new cards (without SRSProgress) for deck", async () => {
      const mockNewCards = [
        {
          id: "new-card-1",
          userId: "user-123",
          deckId: "deck-1",
          cardId: "card-2",
          grade: 0,
          nextReviewDate: new Date(),
          lastReviewDate: null,
          interval: 0,
          easeFactor: 2.5,
          repetitions: 0,
          card: { id: "card-2", front: "new card", back: "new back" },
          deck: { id: "deck-1", title: "Deck 1" },
        },
      ];

      (service.getDueCards as jest.Mock).mockResolvedValue({
        ok: true,
        data: mockNewCards,
      });

      const result = await controller.getDueCards(mockUser, "deck-1");

      expect(result.ok).toBe(true);
      expect(result.data).toEqual(mockNewCards);
      expect(result.data[0].interval).toBe(0);
    });

    it("should return empty array when no due cards", async () => {
      (service.getDueCards as jest.Mock).mockResolvedValue({
        ok: true,
        data: [],
      });

      const result = await controller.getDueCards(mockUser, "deck-1");

      expect(result.ok).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe("getAheadCards", () => {
    it("should return ahead cards (future review) for user", async () => {
      const aheadCards = [
        {
          id: "srs-ahead-1",
          userId: "user-123",
          deckId: "deck-1",
          cardId: "card-4",
          grade: 0,
          nextReviewDate: new Date("2026-04-25"),
          lastReviewDate: null,
          interval: 6,
          easeFactor: 2.5,
          repetitions: 1,
          card: { id: "card-4", front: "future card", back: "back" },
          deck: { id: "deck-1", title: "Deck 1" },
        },
      ];

      (service.getAheadCards as jest.Mock).mockResolvedValue({
        ok: true,
        data: aheadCards,
      });

      const result = await controller.getAheadCards(mockUser, "deck-1");

      expect(service.getAheadCards).toHaveBeenCalledWith("user-123", "deck-1");
      expect(result.ok).toBe(true);
      expect(result.data).toEqual(aheadCards);
      expect(result.data[0].nextReviewDate).toBeInstanceOf(Date);
    });

    it("should return empty array when no ahead cards", async () => {
      (service.getAheadCards as jest.Mock).mockResolvedValue({
        ok: true,
        data: [],
      });

      const result = await controller.getAheadCards(mockUser, "deck-1");

      expect(result.ok).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe("recordGrade", () => {
    it("should record grade and return progress", async () => {
      const dto = { deckId: "deck-1", cardId: "card-1", grade: 2 };
      const mockProgress = {
        id: "srs-new",
        ...dto,
        interval: 6,
        easeFactor: 2.6,
        repetitions: 2,
        nextReviewDate: new Date("2026-04-23"),
      };

      (service.recordGrade as jest.Mock).mockResolvedValue({
        ok: true,
        data: mockProgress,
      });

      const result = await controller.recordGrade(mockUser, dto);

      expect(service.recordGrade).toHaveBeenCalledWith("user-123", dto);
      expect(result.ok).toBe(true);
      expect(result.data.interval).toBe(6);
    });

    it("should handle grade 0 (Again) reset", async () => {
      const dto = { deckId: "deck-1", cardId: "card-1", grade: 0 };
      const mockProgress = {
        id: "srs-reset",
        ...dto,
        interval: 1,
        easeFactor: 2.3,
        repetitions: 0,
        nextReviewDate: new Date("2026-04-20"),
      };

      (service.recordGrade as jest.Mock).mockResolvedValue({
        ok: true,
        data: mockProgress,
      });

      const result = await controller.recordGrade(mockUser, dto);

      expect(result.ok).toBe(true);
      expect(result.data.interval).toBe(1);
      expect(result.data.repetitions).toBe(0);
    });
  });
});
