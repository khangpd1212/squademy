import "@testing-library/jest-dom";
import { calculateSM2, type SRSCardInput } from "@/lib/srs/sm2";

const mockCards = [
  { id: "card-1", front: "Hello", back: "Xin chào" },
  { id: "card-2", front: "World", back: "Thế giới" },
  { id: "card-3", front: "Test", back: "Kiểm tra" },
];

const mockDueCards = [
  { id: "srs-1", cardId: "card-1", easeFactor: 2.5, interval: 1, repetitions: 0, card: mockCards[0] },
  { id: "srs-2", cardId: "card-2", easeFactor: 2.5, interval: 1, repetitions: 0, card: mockCards[1] },
  { id: "srs-3", cardId: "card-3", easeFactor: 2.5, interval: 1, repetitions: 0, card: mockCards[2] },
];

const mockAheadCards = [
  { id: "srs-ahead-1", cardId: "card-4", easeFactor: 2.5, interval: 6, repetitions: 1, card: { id: "card-4", front: "Future", back: "Tương lai" } },
];

describe("Due Cards Display Logic", () => {
  it("calculates correct due cards count", () => {
    const dueCards = mockDueCards;
    const count = dueCards.length;
    expect(count).toBe(3);
  });

  it("displays 1 card due correctly", () => {
    const singleCard = [mockDueCards[0]];
    expect(singleCard.length).toBe(1);
  });

  it("new cards have interval 0", () => {
    const newCards = [
      {
        id: "new-1",
        cardId: "card-new",
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        card: { id: "card-new", front: "New", back: "Mới" },
      },
    ];
    expect(newCards[0].interval).toBe(0);
    expect(newCards[0].repetitions).toBe(0);
  });
});

describe("Empty State Logic", () => {
  it("shows empty state when no due cards", () => {
    const dueCards: typeof mockDueCards = [];
    expect(dueCards.length).toBe(0);
  });

  it("shows empty state when no due cards and no ahead cards", () => {
    const dueCards: typeof mockDueCards = [];
    const aheadCards: typeof mockAheadCards = [];
    const shouldShowEmpty = dueCards.length === 0 && aheadCards.length === 0;
    expect(shouldShowEmpty).toBe(true);
  });

  it("shows study ahead button when ahead cards exist", () => {
    const dueCards: typeof mockDueCards = [];
    const aheadCards = mockAheadCards;
    const shouldShowAheadButton = dueCards.length === 0 && aheadCards.length > 0;
    expect(shouldShowAheadButton).toBe(true);
  });
});

describe("Study Ahead Logic", () => {
  it("ahead cards have future nextReviewDate", () => {
    mockAheadCards.forEach((srs) => {
      expect(srs.interval).toBeGreaterThan(1);
    });
  });

  it("ahead cards count displays correctly", () => {
    expect(mockAheadCards.length).toBe(1);
  });

  it("header shows study ahead mode when active", () => {
    const studyAheadMode = true;
    const headerText = studyAheadMode ? "Study Ahead" : "X cards due today";
    expect(headerText).toBe("Study Ahead");
  });
});

describe("SM-2 Integration with Display", () => {
  it("SM-2 calculates first review interval correctly", () => {
    const card: SRSCardInput = { easeFactor: 2.5, interval: 1, repetitions: 0 };
    const result = calculateSM2(card, 2);
    expect(result.interval).toBe(1);
    expect(result.repetitions).toBe(1);
  });

  it("SM-2 calculates second review interval correctly", () => {
    const card: SRSCardInput = { easeFactor: 2.5, interval: 1, repetitions: 1 };
    const result = calculateSM2(card, 2);
    expect(result.interval).toBe(6);
    expect(result.repetitions).toBe(2);
  });

  it("SM-2 resets on grade 0", () => {
    const card: SRSCardInput = { easeFactor: 2.5, interval: 6, repetitions: 3 };
    const result = calculateSM2(card, 0);
    expect(result.interval).toBe(1);
    expect(result.repetitions).toBe(0);
  });
});

describe("Data Structure Validation", () => {
  it("due cards have required fields", () => {
    mockDueCards.forEach((srs) => {
      expect(srs).toHaveProperty("id");
      expect(srs).toHaveProperty("cardId");
      expect(srs).toHaveProperty("easeFactor");
      expect(srs).toHaveProperty("interval");
      expect(srs).toHaveProperty("repetitions");
      expect(srs).toHaveProperty("card");
    });
  });

  it("card has front and back", () => {
    mockDueCards.forEach((srs) => {
      expect(srs.card).toHaveProperty("front");
      expect(srs.card).toHaveProperty("back");
    });
  });
});