import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import type { CardRow, NoteRow, SetRow } from './types';

const DB_NAME = 'vocab.db';

let db: SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLiteDatabase> {
  if (db) return db;
  db = await openDatabaseAsync(DB_NAME);
  await initSchema(db);
  return db;
}

async function initSchema(database: SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS sets (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY NOT NULL,
      setId TEXT NOT NULL,
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      example TEXT,
      box INTEGER NOT NULL DEFAULT 1,
      nextReviewAt TEXT NOT NULL,
      lastReviewedAt TEXT,
      correctStreak INTEGER NOT NULL DEFAULT 0,
      wrongCount INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (setId) REFERENCES sets(id)
    );

    CREATE INDEX IF NOT EXISTS idx_cards_setId ON cards(setId);
    CREATE INDEX IF NOT EXISTS idx_cards_nextReviewAt ON cards(nextReviewAt);

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      pinned INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_notes_updatedAt ON notes(updatedAt);
  `);

  // Add pinned column for existing installs
  const cols = await database.getAllAsync<{ name: string }>('PRAGMA table_info(notes)');
  const hasPinned = cols.some((c) => c.name === 'pinned');
  if (!hasPinned) {
    try {
      await database.runAsync('ALTER TABLE notes ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0');
    } catch {
      // ignore
    }
  }
}

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  );
}

function todayISO(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export async function createSet(name: string): Promise<SetRow> {
  const database = await getDb();
  const id = uuid();
  const createdAt = new Date().toISOString();
  await database.runAsync(
    'INSERT INTO sets (id, name, createdAt) VALUES (?, ?, ?)',
    [id, name, createdAt]
  );
  return { id, name, createdAt };
}

export async function getAllSets(): Promise<SetRow[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<SetRow>(
    'SELECT * FROM sets ORDER BY createdAt DESC'
  );
  return rows;
}

export async function getSetCardCount(setId: string): Promise<number> {
  const database = await getDb();
  const row = await database.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) as c FROM cards WHERE setId = ?',
    [setId]
  );
  return row?.c ?? 0;
}

export async function createCard(
  setId: string,
  front: string,
  back: string,
  example: string | null = null
): Promise<CardRow> {
  const database = await getDb();
  const id = uuid();
  const nextReviewAt = todayISO();
  await database.runAsync(
    `INSERT INTO cards (id, setId, front, back, example, box, nextReviewAt, lastReviewedAt, correctStreak, wrongCount)
     VALUES (?, ?, ?, ?, ?, 1, ?, NULL, 0, 0)`,
    [id, setId, front, back, example ?? null, nextReviewAt]
  );
  const row = await database.getFirstAsync<CardRow>('SELECT * FROM cards WHERE id = ?', [id]);
  if (!row) throw new Error('Card not created');
  return row;
}

export async function getCardsDueToday(setId: string | null): Promise<CardRow[]> {
  const database = await getDb();
  const today = todayISO();
  const query =
    setId == null
      ? 'SELECT * FROM cards WHERE nextReviewAt <= ? ORDER BY nextReviewAt ASC'
      : 'SELECT * FROM cards WHERE setId = ? AND nextReviewAt <= ? ORDER BY nextReviewAt ASC';
  const params = setId == null ? [today] : [setId, today];
  const rows = await database.getAllAsync<CardRow>(query, params);
  return rows;
}

export async function getCardsForStudy(setId: string): Promise<CardRow[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<CardRow>(
    'SELECT * FROM cards WHERE setId = ? ORDER BY front',
    [setId]
  );
  return rows;
}

export async function markCardReviewed(cardId: string): Promise<void> {
  const database = await getDb();
  const now = new Date().toISOString();
  await database.runAsync('UPDATE cards SET lastReviewedAt = ? WHERE id = ?', [now, cardId]);
}

export async function getCardsDueCount(setId: string | null): Promise<number> {
  const database = await getDb();
  const today = todayISO();
  const query =
    setId == null
      ? 'SELECT COUNT(*) as c FROM cards WHERE nextReviewAt <= ?'
      : 'SELECT COUNT(*) as c FROM cards WHERE setId = ? AND nextReviewAt <= ?';
  const params = setId == null ? [today] : [setId, today];
  const row = await database.getFirstAsync<{ c: number }>(query, params);
  return row?.c ?? 0;
}

export async function getBoxCounts(): Promise<Record<number, number>> {
  const database = await getDb();
  const rows = await database.getAllAsync<{ box: number; c: number }>(
    'SELECT box, COUNT(*) as c FROM cards GROUP BY box'
  );
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of rows) counts[r.box] = r.c;
  return counts;
}

export async function updateCardAfterReview(
  cardId: string,
  newBox: number,
  nextReviewAt: string,
  correct: boolean
): Promise<void> {
  const database = await getDb();
  const now = new Date().toISOString();
  await database.runAsync(
    `UPDATE cards SET box = ?, nextReviewAt = ?, lastReviewedAt = ?,
     correctStreak = CASE WHEN ? THEN correctStreak + 1 ELSE 0 END,
     wrongCount = CASE WHEN ? THEN wrongCount + 1 ELSE wrongCount END
     WHERE id = ?`,
    [newBox, nextReviewAt, now, correct ? 1 : 0, correct ? 0 : 1, cardId]
  );
}

export async function getAllCards(): Promise<CardRow[]> {
  const database = await getDb();
  return database.getAllAsync<CardRow>('SELECT * FROM cards ORDER BY front');
}

export async function getCardsBySet(setId: string, search?: string): Promise<CardRow[]> {
  const database = await getDb();
  if (search?.trim()) {
    const q = `%${search.trim()}%`;
    const rows = await database.getAllAsync<CardRow>(
      'SELECT * FROM cards WHERE setId = ? AND (front LIKE ? OR back LIKE ?) ORDER BY front',
      [setId, q, q]
    );
    return rows;
  }
  const rows = await database.getAllAsync<CardRow>(
    'SELECT * FROM cards WHERE setId = ? ORDER BY front',
    [setId]
  );
  return rows;
}

export async function getSetById(id: string): Promise<SetRow | null> {
  const database = await getDb();
  return database.getFirstAsync<SetRow>('SELECT * FROM sets WHERE id = ?', [id]);
}

const DEFAULT_SET_NAME = 'Default';

export async function getOrCreateDefaultSet(): Promise<SetRow> {
  const database = await getDb();
  let row = await database.getFirstAsync<SetRow>(
    'SELECT * FROM sets WHERE name = ? LIMIT 1',
    [DEFAULT_SET_NAME]
  );
  if (row) return row;
  return createSet(DEFAULT_SET_NAME);
}

export async function getTodayReviewedCount(): Promise<number> {
  const database = await getDb();
  const today = todayISO();
  const row = await database.getFirstAsync<{ c: number }>(
    "SELECT COUNT(*) as c FROM cards WHERE date(lastReviewedAt) = ?",
    [today]
  );
  return row?.c ?? 0;
}

export async function getTotalCardCount(): Promise<number> {
  const database = await getDb();
  const row = await database.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM cards');
  return row?.c ?? 0;
}

export async function getRecentCards(limit: number): Promise<CardRow[]> {
  const database = await getDb();
  return database.getAllAsync<CardRow>(
    `SELECT * FROM cards ORDER BY lastReviewedAt DESC LIMIT ?`,
    [limit]
  );
}

export async function getCardById(cardId: string): Promise<CardRow | null> {
  const database = await getDb();
  return database.getFirstAsync<CardRow>('SELECT * FROM cards WHERE id = ?', [cardId]);
}

export async function updateCard(
  cardId: string,
  front: string,
  back: string,
  example: string | null
): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'UPDATE cards SET front = ?, back = ?, example = ? WHERE id = ?',
    [front, back, example ?? null, cardId]
  );
}

export async function deleteCard(cardId: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM cards WHERE id = ?', [cardId]);
}

const EMPTY_DOC = JSON.stringify({
  type: 'doc',
  content: [{ type: 'paragraph' }],
});

export async function createNote(title: string, body?: string): Promise<NoteRow> {
  const database = await getDb();
  const id = uuid();
  const now = new Date().toISOString();
  const doc = body ?? EMPTY_DOC;
  await database.runAsync(
    'INSERT INTO notes (id, title, body, pinned, createdAt, updatedAt) VALUES (?, ?, ?, 0, ?, ?)',
    [id, title, doc, now, now]
  );
  const row = await database.getFirstAsync<NoteRow>('SELECT * FROM notes WHERE id = ?', [id]);
  if (!row) throw new Error('Note not created');
  return row;
}

export async function listNotes(): Promise<NoteRow[]> {
  const database = await getDb();
  return database.getAllAsync<NoteRow>('SELECT * FROM notes ORDER BY pinned DESC, updatedAt DESC');
}

export async function getNoteById(id: string): Promise<NoteRow | null> {
  const database = await getDb();
  return database.getFirstAsync<NoteRow>('SELECT * FROM notes WHERE id = ?', [id]);
}

export async function updateNote(id: string, title: string, body: string): Promise<void> {
  const database = await getDb();
  const updatedAt = new Date().toISOString();
  await database.runAsync('UPDATE notes SET title = ?, body = ?, updatedAt = ? WHERE id = ?', [
    title,
    body,
    updatedAt,
    id,
  ]);
}

export async function setNotePinned(id: string, pinned: number): Promise<void> {
  const database = await getDb();
  const updatedAt = new Date().toISOString();
  await database.runAsync('UPDATE notes SET pinned = ?, updatedAt = ? WHERE id = ?', [
    pinned ? 1 : 0,
    updatedAt,
    id,
  ]);
}

export async function deleteNote(id: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM notes WHERE id = ?', [id]);
}
