import { calculateSM2, type SRSCardInput } from "./sm2";

describe("SM-2 Algorithm", () => {
  describe("calculateSM2", () => {
    const defaultCard: SRSCardInput = {
      easeFactor: 2.5,
      interval: 1,
      repetitions: 0,
    };

    describe("grade mapping to quality (q)", () => {
      it("maps grade 0 (Again) to q=0", () => {
        const result = calculateSM2(defaultCard, 0);
        expect(result.interval).toBe(1);
        expect(result.repetitions).toBe(0);
      });

      it("maps grade 1 (Hard) to q=2", () => {
        const result = calculateSM2(defaultCard, 1);
        expect(result.easeFactor).toBeLessThan(2.5);
      });

      it("maps grade 2 (Good) to q=3", () => {
        const result = calculateSM2(defaultCard, 2);
        expect(result.repetitions).toBe(1);
        expect(result.interval).toBe(1);
      });

      it("maps grade 3 (Easy) to q=5", () => {
        const result = calculateSM2(defaultCard, 3);
        expect(result.repetitions).toBe(1);
        expect(result.interval).toBe(1);
      });
    });

    describe("first review (repetitions=0)", () => {
      it("grades 0-2 set interval to 1 day", () => {
        expect(calculateSM2(defaultCard, 0).interval).toBe(1);
        expect(calculateSM2(defaultCard, 1).interval).toBe(1);
        expect(calculateSM2(defaultCard, 2).interval).toBe(1);
      });

      it("grade 3 (Easy) sets interval to 1 day on first review (SM-2: I(1) = 1)", () => {
        const result = calculateSM2(defaultCard, 3);
        expect(result.interval).toBe(1);
        expect(result.repetitions).toBe(1);
      });
    });

    describe("second review (repetitions=1)", () => {
      const secondReviewCard: SRSCardInput = {
        easeFactor: 2.5,
        interval: 1,
        repetitions: 1,
      };

      it("grade 0 resets to interval 1", () => {
        const result = calculateSM2(secondReviewCard, 0);
        expect(result.interval).toBe(1);
        expect(result.repetitions).toBe(0);
      });

      it("grade 2 (Good) sets interval to 6 days on second review", () => {
        const result = calculateSM2(secondReviewCard, 2);
        expect(result.interval).toBe(6);
        expect(result.repetitions).toBe(2);
      });

      it("grade 3 (Easy) sets interval to 6 on second review (SM-2: I(2) = 6)", () => {
        const result = calculateSM2(secondReviewCard, 3);
        expect(result.interval).toBe(6);
        expect(result.repetitions).toBe(2);
      });
    });

    describe("subsequent reviews (repetitions >= 2)", () => {
      const establishedCard: SRSCardInput = {
        easeFactor: 2.5,
        interval: 6,
        repetitions: 2,
      };

      it("grade 0 resets interval and repetitions", () => {
        const result = calculateSM2(establishedCard, 0);
        expect(result.interval).toBe(1);
        expect(result.repetitions).toBe(0);
      });

      it("grade 2 (Good) multiplies interval by ease factor", () => {
        const result = calculateSM2(establishedCard, 2);
        expect(result.interval).toBe(Math.round(6 * result.easeFactor));
        expect(result.repetitions).toBe(3);
      });

      it("grade 3 (Easy) gives higher multiplier", () => {
        const goodResult = calculateSM2(establishedCard, 2);
        const easyResult = calculateSM2(establishedCard, 3);
        expect(easyResult.interval).toBeGreaterThan(goodResult.interval);
      });
    });

    describe("ease factor calculations", () => {
      it("reduces ease factor for hard grades", () => {
        const result = calculateSM2(defaultCard, 1);
        expect(result.easeFactor).toBeLessThan(2.5);
      });

      it("increases ease factor for easy grades", () => {
        const result = calculateSM2(defaultCard, 3);
        expect(result.easeFactor).toBeGreaterThan(2.5);
      });

      it("never goes below 1.3", () => {
        let card: SRSCardInput = { easeFactor: 1.4, interval: 1, repetitions: 0 };
        for (let i = 0; i < 10; i++) {
          card = {
            easeFactor: card.easeFactor,
            interval: 1,
            repetitions: 0,
          };
          const result = calculateSM2(card, 0);
          expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
        }
      });
    });

    describe("next review date", () => {
      it("sets next review date based on interval", () => {
        const result = calculateSM2(defaultCard, 2);
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() + result.interval);
        expect(result.nextReviewDate.getDate()).toBe(expectedDate.getDate());
      });
    });

    describe("SM-2 formula verification", () => {
      it("follows EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))", () => {
        const card: SRSCardInput = { easeFactor: 2.5, interval: 1, repetitions: 0 };
        const result = calculateSM2(card, 2);
        const q = 3;
        const expectedEF = 2.5 + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
        expect(result.easeFactor).toBeCloseTo(expectedEF, 5);
      });
    });
  });
});
