export interface SRSCardInput {
  easeFactor: number;
  interval: number;
  repetitions: number;
}

export interface SM2Result {
  easeFactor: number;
  interval: number;
  nextReviewDate: Date;
  repetitions: number;
}

export function calculateSM2(card: SRSCardInput, grade: number): SM2Result {
  const q = [0, 2, 3, 5][grade] as number;

  let newEF = card.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  newEF = Math.max(1.3, newEF);

  let newInterval: number;
  let newRepetitions: number;

  if (q < 3) {
    newInterval = 1;
    newRepetitions = 0;
  } else {
    if (card.repetitions === 0) {
      newInterval = 1;
    } else if (card.repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(card.interval * newEF);
    }
    newRepetitions = card.repetitions + 1;
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);

  return {
    easeFactor: newEF,
    interval: newInterval,
    nextReviewDate: nextReview,
    repetitions: newRepetitions,
  };
}