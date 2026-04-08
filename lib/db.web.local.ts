import type { CardRow, NoteRow, SetRow } from './types';

const STORAGE_KEYS = { sets: 'vocab_sets', cards: 'vocab_cards', notes: 'vocab_notes' } as const;

const EMPTY_DOC = JSON.stringify({
  type: 'doc',
  content: [{ type: 'paragraph' }],
});

function readFromStorage<T>(key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeToStorage(key: string, value: unknown): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota or other storage errors
  }
}

function getSets(): SetRow[] {
  return readFromStorage(STORAGE_KEYS.sets, []);
}

function getCards(): CardRow[] {
  return readFromStorage(STORAGE_KEYS.cards, []);
}

function setSets(sets: SetRow[]): void {
  writeToStorage(STORAGE_KEYS.sets, sets);
}

function setCards(cards: CardRow[]): void {
  writeToStorage(STORAGE_KEYS.cards, cards);
}

function getNotes(): NoteRow[] {
  const raw = readFromStorage<NoteRow[]>(STORAGE_KEYS.notes, []);
  return raw.map((n) => ({ ...n, pinned: typeof n.pinned === 'number' ? n.pinned : 0 }));
}

function setNotes(notes: NoteRow[]): void {
  writeToStorage(STORAGE_KEYS.notes, notes);
}

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  );
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function createSet(name: string): Promise<SetRow> {
  const sets = getSets();
  const id = uuid();
  const createdAt = new Date().toISOString();
  const row: SetRow = { id, name, createdAt };
  sets.push(row);
  setSets(sets.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1)));
  return row;
}

export async function getAllSets(): Promise<SetRow[]> {
  return [...getSets()].sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
}

export async function getSetCardCount(setId: string): Promise<number> {
  return getCards().filter((c) => c.setId === setId).length;
}

export async function createCard(
  setId: string,
  front: string,
  back: string,
  example: string | null = null
): Promise<CardRow> {
  const cards = getCards();
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
  setCards(cards.sort((a, b) => (a.front > b.front ? 1 : -1)));
  return row;
}

export async function getCardsDueToday(setId: string | null): Promise<CardRow[]> {
  const today = todayISO();
  const cards = getCards();
  const due = cards.filter(
    (c) => c.nextReviewAt <= today && (setId == null || c.setId === setId)
  );
  return due.sort((a, b) => (a.nextReviewAt > b.nextReviewAt ? 1 : -1));
}

export async function getCardsForStudy(setId: string): Promise<CardRow[]> {
  return getCards()
    .filter((c) => c.setId === setId)
    .sort((a, b) => (a.front > b.front ? 1 : -1));
}

export async function markCardReviewed(cardId: string): Promise<void> {
  const cards = getCards();
  const card = cards.find((c) => c.id === cardId);
  if (card) {
    card.lastReviewedAt = new Date().toISOString();
    setCards(cards);
  }
}

export async function getCardsDueCount(setId: string | null): Promise<number> {
  const today = todayISO();
  return getCards().filter(
    (c) => c.nextReviewAt <= today && (setId == null || c.setId === setId)
  ).length;
}

export async function getBoxCounts(): Promise<Record<number, number>> {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const c of getCards()) counts[c.box] = (counts[c.box] ?? 0) + 1;
  return counts;
}

export async function updateCardAfterReview(
  cardId: string,
  newBox: number,
  nextReviewAt: string,
  correct: boolean
): Promise<void> {
  const cards = getCards();
  const card = cards.find((c) => c.id === cardId);
  if (!card) return;
  card.box = newBox;
  card.nextReviewAt = nextReviewAt;
  card.lastReviewedAt = new Date().toISOString();
  if (correct) card.correctStreak += 1;
  else card.wrongCount += 1;
  setCards(cards);
}

export async function getAllCards(): Promise<CardRow[]> {
  return [...getCards()].sort((a, b) => (a.front > b.front ? 1 : -1));
}

export async function getCardsBySet(setId: string, search?: string): Promise<CardRow[]> {
  let list = getCards().filter((c) => c.setId === setId);
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
  return getSets().find((s) => s.id === id) ?? null;
}

const DEFAULT_SET_NAME = 'Default';

export async function getOrCreateDefaultSet(): Promise<SetRow> {
  const sets = getSets();
  const existing = sets.find((s) => s.name === DEFAULT_SET_NAME);
  if (existing) return existing;
  return createSet(DEFAULT_SET_NAME);
}

export async function getTodayReviewedCount(): Promise<number> {
  const today = todayISO();
  return getCards().filter(
    (c) => c.lastReviewedAt && c.lastReviewedAt.slice(0, 10) === today
  ).length;
}

export async function getTotalCardCount(): Promise<number> {
  return getCards().length;
}

export async function getRecentCards(limit: number): Promise<CardRow[]> {
  return [...getCards()]
    .sort((a, b) => {
      const aAt = a.lastReviewedAt ?? '';
      const bAt = b.lastReviewedAt ?? '';
      return bAt.localeCompare(aAt);
    })
    .slice(0, limit);
}

export async function getCardById(cardId: string): Promise<CardRow | null> {
  return getCards().find((c) => c.id === cardId) ?? null;
}

export async function updateCard(
  cardId: string,
  front: string,
  back: string,
  example: string | null
): Promise<void> {
  const cards = getCards();
  const card = cards.find((c) => c.id === cardId);
  if (card) {
    card.front = front;
    card.back = back;
    card.example = example ?? null;
    setCards(cards);
  }
}

export async function deleteCard(cardId: string): Promise<void> {
  const cards = getCards().filter((c) => c.id !== cardId);
  setCards(cards);
}

export async function createNote(title: string, body?: string): Promise<NoteRow> {
  const notes = getNotes();
  const id = uuid();
  const now = new Date().toISOString();
  const row: NoteRow = {
    id,
    title,
    body: body ?? EMPTY_DOC,
    pinned: 0,
    createdAt: now,
    updatedAt: now,
  };
  notes.push(row);
  setNotes(notes.sort((a, b) => (b.pinned - a.pinned) || (b.updatedAt > a.updatedAt ? 1 : -1)));
  return row;
}

export async function listNotes(): Promise<NoteRow[]> {
  return [...getNotes()].sort((a, b) => (b.pinned - a.pinned) || (b.updatedAt > a.updatedAt ? 1 : -1));
}

export async function getNoteById(id: string): Promise<NoteRow | null> {
  return getNotes().find((n) => n.id === id) ?? null;
}

export async function updateNote(id: string, title: string, body: string): Promise<void> {
  const notes = getNotes();
  const note = notes.find((n) => n.id === id);
  if (!note) return;
  note.title = title;
  note.body = body;
  note.updatedAt = new Date().toISOString();
  setNotes(notes);
}

export async function setNotePinned(id: string, pinned: number): Promise<void> {
  const notes = getNotes();
  const note = notes.find((n) => n.id === id);
  if (!note) return;
  note.pinned = pinned ? 1 : 0;
  note.updatedAt = new Date().toISOString();
  setNotes(notes);
}

export async function deleteNote(id: string): Promise<void> {
  setNotes(getNotes().filter((n) => n.id !== id));
}
