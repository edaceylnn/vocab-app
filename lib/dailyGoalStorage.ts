import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'vocab_daily_goal';

export const DEFAULT_DAILY_GOAL = 30;
const MIN_GOAL = 1;
const MAX_GOAL = 500;

function clamp(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_DAILY_GOAL;
  return Math.min(MAX_GOAL, Math.max(MIN_GOAL, Math.round(n)));
}

export async function getDailyGoal(): Promise<number> {
  try {
    let raw: string | null = null;
    if (Platform.OS === 'web') {
      if (typeof localStorage === 'undefined') return DEFAULT_DAILY_GOAL;
      raw = localStorage.getItem(KEY);
    } else {
      raw = await SecureStore.getItemAsync(KEY);
    }
    if (raw == null || raw === '') return DEFAULT_DAILY_GOAL;
    return clamp(Number(raw));
  } catch {
    return DEFAULT_DAILY_GOAL;
  }
}

export async function setDailyGoal(value: number): Promise<void> {
  const v = clamp(value);
  const str = String(v);
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(KEY, str);
    return;
  }
  await SecureStore.setItemAsync(KEY, str);
}
