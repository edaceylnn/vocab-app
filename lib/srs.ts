import {
  LEITNER_INTERVAL_DAYS,
  MAX_BOX,
  type CardRow,
  type SRSRating,
} from './types';
import { updateCardAfterReview } from './db';

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function getNextBoxAndDate(
  currentBox: number,
  rating: SRSRating
): { newBox: number; nextReviewAt: string } {
  const today = new Date().toISOString().slice(0, 10);
  if (rating === 'forgot') {
    return { newBox: 1, nextReviewAt: today };
  }
  const nextBox = Math.min(
    rating === 'hard' ? currentBox : currentBox + (rating === 'easy' ? 2 : 1),
    MAX_BOX
  );
  const interval = LEITNER_INTERVAL_DAYS[nextBox] ?? 1;
  return { newBox: nextBox, nextReviewAt: addDays(today, interval) };
}

export async function recordReview(
  card: CardRow,
  rating: SRSRating
): Promise<void> {
  const { newBox, nextReviewAt } = getNextBoxAndDate(card.box, rating);
  const correct = rating !== 'forgot';
  await updateCardAfterReview(card.id, newBox, nextReviewAt, correct);
}
