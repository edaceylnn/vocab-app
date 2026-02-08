import type { CardRow, SetRow } from './types';

const sets: SetRow[] = [];
const cards: CardRow[] = [];

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  );
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function createSet(name: string): Promise<SetRow> {
  const id = uuid();
  const createdAt = new Date().toISOString();
  sets.push({ id, name, createdAt });
  return { id, name, createdAt };
}

export async function getAllSets(): Promise<SetRow[]> {
  return [...sets].sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
}

export async function getSetCardCount(setId: string): Promise<number> {
  return cards.filter((c) => c.setId === setId).length;
}

export async function createCard(
  setId: string,
  front: string,
  back: string,
  example: string | null = null
): Promise<CardRow> {
  const id = uuid();
  const nextReviewAt = todayISO();
  const row: CardRow = {
    id,
    setId,
    front,
    back,
    example: example ?? null,
    box: 1,
    nextReviewAt,
    lastReviewedAt: null,
    correctStreak: 0,
    wrongCount: 0,
  };
  cards.push(row);
  return row;
}

export async function getCardsDueToday(setId: string | null): Promise<CardRow[]> {
  const today = todayISO();
  const due = cards.filter(
    (c) => c.nextReviewAt <= today && (setId == null || c.setId === setId)
  );
  return due.sort((a, b) => (a.nextReviewAt > b.nextReviewAt ? 1 : -1));
}

export async function getCardsForStudy(setId: string): Promise<CardRow[]> {
  return cards.filter((c) => c.setId === setId).sort((a, b) => (a.front > b.front ? 1 : -1));
}

export async function markCardReviewed(cardId: string): Promise<void> {
  const card = cards.find((c) => c.id === cardId);
  if (card) card.lastReviewedAt = new Date().toISOString();
}

export async function getCardsDueCount(setId: string | null): Promise<number> {
  const today = todayISO();
  return cards.filter(
    (c) => c.nextReviewAt <= today && (setId == null || c.setId === setId)
  ).length;
}

export async function getBoxCounts(): Promise<Record<number, number>> {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const c of cards) counts[c.box] = (counts[c.box] ?? 0) + 1;
  return counts;
}

export async function updateCardAfterReview(
  cardId: string,
  newBox: number,
  nextReviewAt: string,
  correct: boolean
): Promise<void> {
  const card = cards.find((c) => c.id === cardId);
  if (!card) return;
  card.box = newBox;
  card.nextReviewAt = nextReviewAt;
  card.lastReviewedAt = new Date().toISOString();
  if (correct) card.correctStreak += 1;
  else card.wrongCount += 1;
}

export async function getAllCards(): Promise<CardRow[]> {
  return [...cards].sort((a, b) => (a.front > b.front ? 1 : -1));
}

export async function getCardsBySet(setId: string, search?: string): Promise<CardRow[]> {
  let list = cards.filter((c) => c.setId === setId);
  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(
      (c) =>
        c.front.toLowerCase().includes(q) || c.back.toLowerCase().includes(q)
    );
  }
  return list.sort((a, b) => (a.front > b.front ? 1 : -1));
}

export async function getSetById(id: string): Promise<SetRow | null> {
  return sets.find((s) => s.id === id) ?? null;
}

const DEFAULT_SET_NAME = 'Default';

export async function getOrCreateDefaultSet(): Promise<SetRow> {
  const existing = sets.find((s) => s.name === DEFAULT_SET_NAME);
  if (existing) return existing;
  return createSet(DEFAULT_SET_NAME);
}

export async function getTodayReviewedCount(): Promise<number> {
  const today = todayISO();
  return cards.filter(
    (c) => c.lastReviewedAt && c.lastReviewedAt.slice(0, 10) === today
  ).length;
}

export async function getTotalCardCount(): Promise<number> {
  return cards.length;
}

export async function getRecentCards(limit: number): Promise<CardRow[]> {
  return [...cards]
    .sort((a, b) => {
      const aAt = a.lastReviewedAt ?? '';
      const bAt = b.lastReviewedAt ?? '';
      return bAt.localeCompare(aAt);
    })
    .slice(0, limit);
}

export async function getCardById(cardId: string): Promise<CardRow | null> {
  return cards.find((c) => c.id === cardId) ?? null;
}

export async function updateCard(
  cardId: string,
  front: string,
  back: string,
  example: string | null
): Promise<void> {
  const card = cards.find((c) => c.id === cardId);
  if (card) {
    card.front = front;
    card.back = back;
    card.example = example ?? null;
  }
}

export async function deleteCard(cardId: string): Promise<void> {
  const idx = cards.findIndex((c) => c.id === cardId);
  if (idx !== -1) cards.splice(idx, 1);
}
