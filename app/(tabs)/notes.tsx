import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import Colors, { primary } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import {
  CONTENT_BOTTOM_PADDING,
  PAGE_PADDING_HORIZONTAL,
  PAGE_PADDING_TOP,
} from '@/constants/Layout';
import { useColorScheme } from '@/components/useColorScheme';
import { SearchBar } from '@/components/SearchBar';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { listNotes, setNotePinned } from '@/lib/db';
import type { NoteRow } from '@/lib/types';
import { hapticLight } from '@/lib/haptics';
import { notePreviewFromBody } from '@/lib/notePreview';
import { useDebouncedValue } from '@/lib/useDebouncedValue';

function formatUpdated(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export default function NotesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 200);

  const load = useCallback(() => {
    setLoading(true);
    void listNotes().then((rows) => {
      setNotes(rows);
      setLoading(false);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onNewNote = async () => {
    hapticLight();
    router.push('/note/new');
  };

  const headerPaddingTop = Math.max(insets.top, 16) + PAGE_PADDING_TOP;
  const contentPaddingBottom = CONTENT_BOTTOM_PADDING + insets.bottom;

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) => {
      const title = (n.title ?? '').toLowerCase();
      const preview = notePreviewFromBody(n.body, 180).toLowerCase();
      return title.includes(q) || preview.includes(q);
    });
  }, [notes, debouncedQuery]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: headerPaddingTop,
            paddingHorizontal: PAGE_PADDING_HORIZONTAL,
          },
        ]}
      >
        <Text style={[styles.screenTitle, { color: colors.text }]}>Notes</Text>
        <Pressable
          onPress={() => void onNewNote()}
          onLongPress={() => {
            Alert.alert('New note', 'Start from a template?', [
              { text: 'Blank', onPress: () => router.push('/note/new') },
              { text: 'Study', onPress: () => router.push('/note/new?template=study') },
              { text: 'Meeting', onPress: () => router.push('/note/new?template=meeting') },
              { text: 'Vocabulary', onPress: () => router.push('/note/new?template=vocabulary') },
              { text: 'Cancel', style: 'cancel' },
            ]);
          }}
          style={({ pressed }) => [
            styles.addPill,
            { backgroundColor: primary, opacity: pressed ? 0.9 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="New note"
        >
          <MaterialCommunityIcons name="plus" size={18} color="#fff" />
          <Text style={styles.addPillText}>New</Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: PAGE_PADDING_HORIZONTAL }}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search notes" colors={colors} />
      </View>

      {filtered.length === 0 ? (
        <View style={[styles.empty, { paddingBottom: contentPaddingBottom }]}>
          <MaterialCommunityIcons name="notebook-outline" size={48} color={colors.muted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {debouncedQuery.trim() ? 'No matches' : 'No notes yet'}
          </Text>
          <Text style={[styles.emptyHint, { color: colors.muted }]}>
            {debouncedQuery.trim()
              ? 'Try a different search term.'
              : 'Capture ideas, highlights, and headings while you study.'}
          </Text>
          {!debouncedQuery.trim() && (
            <PrimaryButton title="New note" colors={colors} onPress={() => void onNewNote()} style={styles.emptyCta} />
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          initialNumToRender={10}
          windowSize={7}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: contentPaddingBottom, paddingHorizontal: PAGE_PADDING_HORIZONTAL },
          ]}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/note/${item.id}`)}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: colors.surface1,
                  borderColor: colors.border,
                  shadowColor: colors.shadow,
                  opacity: pressed ? 0.92 : 1,
                  marginBottom: 8,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Open note ${item.title}`}
            >
              <MaterialCommunityIcons name="text-box-outline" size={22} color={primary} />
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={2}>
                  {item.title.trim() || 'Untitled'}
                </Text>
                <Text style={[styles.rowPreview, { color: colors.muted }]} numberOfLines={1}>
                  {notePreviewFromBody(item.body, 120) || ' '}
                </Text>
                <Text style={[styles.rowMeta, { color: colors.muted }]}>
                  {formatUpdated(item.updatedAt)}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  void (async () => {
                    await setNotePinned(item.id, item.pinned ? 0 : 1);
                    load();
                  })();
                }}
                style={({ pressed }) => [{ padding: 8, opacity: pressed ? 0.85 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel={item.pinned ? 'Unpin note' : 'Pin note'}
              >
                <MaterialCommunityIcons
                  name={item.pinned ? 'pin' : 'pin-outline'}
                  size={20}
                  color={item.pinned ? primary : colors.muted}
                />
              </Pressable>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  screenTitle: { ...Typography.titleLarge },
  addPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  addPillText: { ...Typography.label, color: '#fff', fontSize: 13 },
  listContent: { paddingTop: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 22,
    elevation: 6,
  },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: { ...Typography.subheading },
  rowPreview: { ...Typography.bodySmall, marginTop: 6 },
  rowMeta: { ...Typography.caption, marginTop: 4 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: { ...Typography.titleMedium, marginTop: 8 },
  emptyHint: { ...Typography.bodySmall, textAlign: 'center' },
  emptyCta: { marginTop: 16 },
});
