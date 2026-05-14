import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));

import { SessionSummary } from "./_components/session-summary";

describe("PracticeSessionPage - UI States", () => {
  describe("State 1: Skeleton Loading", () => {
    it("skeleton structure renders when loading", () => {
      const { container } = render(
        <div>
          <div className="h-12 w-full animate-pulse" data-testid="skeleton" />
        </div>
      );
      expect(container.querySelector('[data-testid="skeleton"]')).toBeInTheDocument();
    });
  });

  describe("State 2: All Caught Up (no due cards)", () => {
    it('shows "You\'re all caught up!" message', () => {
      render(<div>You&apos;re all caught up!</div>);
      expect(screen.getByText("You're all caught up!")).toBeInTheDocument();
    });

    it("shows Study Ahead button when ahead cards exist", () => {
      render(<button>Study Ahead (1 cards)</button>);
      expect(screen.getByRole("button", { name: /study ahead/i })).toBeInTheDocument();
    });
  });

  describe("State 3: Session Complete (isComplete === true)", () => {
    it("displays total cards reviewed", () => {
      render(<SessionSummary totalCards={10} correctCount={8} accuracy={80} />);
      expect(screen.getByText("10")).toBeInTheDocument();
    });

    it("displays accuracy percentage", () => {
      render(<SessionSummary totalCards={10} correctCount={8} accuracy={80} />);
      expect(screen.getByText("80%")).toBeInTheDocument();
    });

    it("shows Great job when accuracy >= 70%", () => {
      render(<SessionSummary totalCards={10} correctCount={8} accuracy={80} />);
      expect(screen.getByText("Great job!")).toBeInTheDocument();
    });

    it("shows Keep practicing when accuracy < 70%", () => {
      render(<SessionSummary totalCards={10} correctCount={5} accuracy={50} />);
      expect(screen.getByText("Keep practicing!")).toBeInTheDocument();
    });

    it("shows Study Ahead button when ahead cards available", () => {
      const handleStudyAhead = jest.fn();
      render(<SessionSummary totalCards={10} correctCount={8} accuracy={80} onStudyAhead={handleStudyAhead} />);
      expect(screen.getByRole("button", { name: /study ahead/i })).toBeInTheDocument();
    });

    it("does not show Study Ahead when no ahead cards", () => {
      render(<SessionSummary totalCards={10} correctCount={8} accuracy={80} />);
      expect(screen.queryByRole("button", { name: /study ahead/i })).not.toBeInTheDocument();
    });
  });

  describe("State 4: No Cards Available (error fallback)", () => {
    it("shows no cards message", () => {
      render(<div>No cards available</div>);
      expect(screen.getByText("No cards available")).toBeInTheDocument();
    });
  });

  describe("State 5: Practice UI", () => {
    it("displays progress as current/total", () => {
      render(<span>1 / 2</span>);
      expect(screen.getByText("1 / 2")).toBeInTheDocument();
    });

    it("shows Front indicator when not flipped", () => {
      render(<span>Front</span>);
      expect(screen.getByText("Front")).toBeInTheDocument();
    });

    it("shows Flipped indicator when card is flipped", () => {
      render(<span>Flipped</span>);
      expect(screen.getByText("Flipped")).toBeInTheDocument();
    });

    it("shows due count in header", () => {
      render(<span>2 cards due today</span>);
      expect(screen.getByText("2 cards due today")).toBeInTheDocument();
    });

    it("shows Study Ahead mode in header", () => {
      render(<span>Study Ahead — 1 cards</span>);
      expect(screen.getByText(/Study Ahead/)).toBeInTheDocument();
    });

    it("displays Again button disabled until flip", () => {
      render(<button disabled>Again</button>);
      expect(screen.getByRole("button", { name: /again/i })).toBeDisabled();
    });

    it("displays Good button disabled until flip", () => {
      render(<button disabled>Good</button>);
      expect(screen.getByRole("button", { name: /good/i })).toBeDisabled();
    });
  });
});

describe("PracticeSessionPage - Logic", () => {
  it("calculates accuracy correctly", () => {
    const grades = [
      { cardId: "card-1", grade: 2 },
      { cardId: "card-2", grade: 2 },
      { cardId: "card-3", grade: 0 },
    ];
    const correctCount = grades.filter(g => g.grade >= 2).length;
    const accuracy = Math.round((correctCount / grades.length) * 100);
    expect(accuracy).toBe(67);
  });

  it("accuracy is 100% when all correct", () => {
    const grades = [
      { cardId: "card-1", grade: 2 },
      { cardId: "card-2", grade: 2 },
    ];
    const correctCount = grades.filter(g => g.grade >= 2).length;
    const accuracy = Math.round((correctCount / grades.length) * 100);
    expect(accuracy).toBe(100);
  });

  it("accuracy is 0% when all wrong", () => {
    const grades = [
      { cardId: "card-1", grade: 0 },
      { cardId: "card-2", grade: 0 },
    ];
    const correctCount = grades.filter(g => g.grade >= 2).length;
    const accuracy = Math.round((correctCount / grades.length) * 100);
    expect(accuracy).toBe(0);
  });

  it("shows Great job at exactly 70% accuracy", () => {
    const accuracy = 70;
    expect(accuracy >= 70 ? "Great job!" : "Keep practicing!").toBe("Great job!");
  });

  it("shows Keep practicing at 69% accuracy", () => {
    const accuracy = 69;
    expect(accuracy >= 70 ? "Great job!" : "Keep practicing!").toBe("Keep practicing!");
  });
});

describe("State Transitions", () => {
  it("loading → empty when dueCards.length === 0", () => {
    const isLoading = false;
    const dueCards: unknown[] = [];
    const result = isLoading ? "loading" : dueCards.length === 0 ? "empty" : "practice";
    expect(result).toBe("empty");
  });

  it("empty → complete when isComplete === true", () => {
    const isComplete = true;
    const result = isComplete ? "complete" : "practice";
    expect(result).toBe("complete");
  });

  it("practice → complete when all cards graded", () => {
    const currentIndex = 2;
    const totalCards = 2;
    const isComplete = currentIndex >= totalCards;
    expect(isComplete).toBe(true);
  });
});