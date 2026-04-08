import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'vocab_last_set_for_notes_card';

export async function getLastSetIdForNotesCard(): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(KEY);
  }
  return SecureStore.getItemAsync(KEY);
}

export async function setLastSetIdForNotesCard(setId: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(KEY, setId);
    return;
  }
  await SecureStore.setItemAsync(KEY, setId);
}

