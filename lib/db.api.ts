import type { CardRow, SetRow } from './types';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data as T;
}

export async function createSet(name: string): Promise<SetRow> {
  return api<SetRow>('/api/sets', { method: 'POST', body: JSON.stringify({ name }) });
}

export async function getAllSets(): Promise<SetRow[]> {
  return api<SetRow[]>('/api/sets');
}

export async function getSetById(id: string): Promise<SetRow | null> {
  try {
    return await api<SetRow>(`/api/sets/${id}`);
  } catch {
    return null;
  }
}

export async function getSetCardCount(setId: string): Promise<number> {
  const { count } = await api<{ count: number }>(`/api/sets/${setId}/count`);
  return count;
}

export async function getOrCreateDefaultSet(): Promise<SetRow> {
  return api<SetRow>('/api/sets/default');
}

export async function createCard(
  setId: string,
  front: string,
  back: string,
  example: string | null = null
): Promise<CardRow> {
  return api<CardRow>('/api/cards', {
    method: 'POST',
    body: JSON.stringify({ setId, front, back, example }),
  });
}

export async function getAllCards(): Promise<CardRow[]> {
  return api<CardRow[]>('/api/cards');
}

export async function getCardsBySet(setId: string, search?: string): Promise<CardRow[]> {
  const q = search?.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
  return api<CardRow[]>(`/api/cards/by-set/${setId}${q}`);
}

export async function getCardsForStudy(setId: string): Promise<CardRow[]> {
  return api<CardRow[]>(`/api/cards/for-study/${setId}`);
}

export async function getCardsDueToday(setId: string | null): Promise<CardRow[]> {
  const q = setId != null ? `?setId=${encodeURIComponent(setId)}` : '';
  return api<CardRow[]>(`/api/cards/due${q}`);
}

export async function getCardsDueCount(setId: string | null): Promise<number> {
  const q = setId != null ? `?setId=${encodeURIComponent(setId)}` : '';
  const { count } = await api<{ count: number }>(`/api/cards/due-count${q}`);
  return count;
}

export async function getTodayReviewedCount(): Promise<number> {
  const { count } = await api<{ count: number }>('/api/cards/today-reviewed-count');
  return count;
}

export async function getTotalCardCount(): Promise<number> {
  const { count } = await api<{ count: number }>('/api/cards/total-count');
  return count;
}

export async function getBoxCounts(): Promise<Record<number, number>> {
  return api<Record<number, number>>('/api/cards/box-counts');
}

export async function getRecentCards(limit: number): Promise<CardRow[]> {
  return api<CardRow[]>(`/api/cards/recent?limit=${limit}`);
}

export async function getCardById(cardId: string): Promise<CardRow | null> {
  try {
    return await api<CardRow>(`/api/cards/${cardId}`);
  } catch {
    return null;
  }
}

export async function updateCard(
  cardId: string,
  front: string,
  back: string,
  example: string | null
): Promise<void> {
  await api(`/api/cards/${cardId}`, {
    method: 'PATCH',
    body: JSON.stringify({ front, back, example }),
  });
}

export async function deleteCard(cardId: string): Promise<void> {
  await api(`/api/cards/${cardId}`, { method: 'DELETE' });
}

export async function markCardReviewed(cardId: string): Promise<void> {
  await api(`/api/cards/${cardId}/reviewed`, { method: 'POST' });
}

export async function updateCardAfterReview(
  cardId: string,
  newBox: number,
  nextReviewAt: string,
  correct: boolean
): Promise<void> {
  await api(`/api/cards/${cardId}/after-review`, {
    method: 'POST',
    body: JSON.stringify({ newBox, nextReviewAt, correct }),
  });
}
