export interface SetRow {
  id: string;
  name: string;
  createdAt: string;
}

export interface CardRow {
  id: string;
  setId: string;
  front: string;
  back: string;
  example: string | null;
  box: number;
  nextReviewAt: string;
  lastReviewedAt: string | null;
  correctStreak: number;
  wrongCount: number;
}

export type SRSRating = 'forgot' | 'hard' | 'good' | 'easy';

export const LEITNER_INTERVAL_DAYS: Record<number, number> = {
  1: 1,
  2: 2,
  3: 4,
  4: 7,
  5: 14,
};

export const MAX_BOX = 5;
