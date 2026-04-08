import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getDailyGoal } from './dailyGoalStorage';
import {
  getAllSets,
  getCardsDueCount,
  getCardsDueToday,
  getOrCreateDefaultSet,
  getSetCardCount,
  getTodayReviewedCount,
  getTotalCardCount,
} from './db';
import type { CardRow, SetRow } from './types';

const RECENT_SETS_LIMIT = 3;

export function useSets(): {
  sets: SetRow[];
  defaultSet: SetRow | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const [sets, setSets] = useState<SetRow[]>([]);
  const [defaultSet, setDefaultSet] = useState<SetRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const defaultRow = await getOrCreateDefaultSet();
      const list = await getAllSets();
      setDefaultSet(defaultRow);
      setSets(list);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load sets';
      setError(message);
      setDefaultSet(null);
      setSets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { sets, defaultSet, loading, error, refresh };
}

export function useCardsDueToday(setId: string | null): {
  cards: CardRow[];
  count: number;
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const [cards, setCards] = useState<CardRow[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [dueCards, dueCount] = await Promise.all([
        getCardsDueToday(setId),
        getCardsDueCount(setId),
      ]);
      setCards(dueCards);
      setCount(dueCount);
    } finally {
      setLoading(false);
    }
  }, [setId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { cards, count, loading, refresh };
}

export type SetWithCount = { id: string; name: string; count: number };

export function useDailyStats(): {
  defaultSetId: string | null;
  totalCards: number;
  reviewedToday: number;
  totalInLibrary: number;
  recentSets: SetWithCount[];
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const [defaultSetId, setDefaultSetId] = useState<string | null>(null);
  const [totalCards, setTotalCards] = useState(0);
  const [reviewedToday, setReviewedToday] = useState(0);
  const [totalInLibrary, setTotalInLibrary] = useState(0);
  const [recentSets, setRecentSets] = useState<SetWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const defaultSet = await getOrCreateDefaultSet();
      const allSets = await getAllSets();
      const recent = allSets.slice(0, RECENT_SETS_LIMIT);
      const counts = await Promise.all(recent.map((s) => getSetCardCount(s.id)));
      const withCount: SetWithCount[] = recent.map((s, i) => ({
        id: s.id,
        name: s.name,
        count: counts[i] ?? 0,
      }));
      const [total, reviewed, totalCount] = await Promise.all([
        getCardsDueCount(defaultSet.id),
        getTodayReviewedCount(),
        getTotalCardCount(),
      ]);
      setDefaultSetId(defaultSet.id);
      setTotalCards(total);
      setReviewedToday(reviewed);
      setTotalInLibrary(totalCount);
      setRecentSets(withCount);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return {
    defaultSetId,
    totalCards,
    reviewedToday,
    totalInLibrary,
    recentSets,
    loading,
    refresh,
  };
}

export function useDailyGoal(): { goal: number; refresh: () => Promise<void> } {
  const [goal, setGoal] = useState(30);

  const refresh = useCallback(async () => {
    const g = await getDailyGoal();
    setGoal(g);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { goal, refresh };
}
