import { useCallback, useMemo, useState } from 'react';
import {
  StyleSheet,
  Pressable,
  SectionList,
  View,
  Text,
  Alert,
  ActionSheetIOS,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import Colors, { primary } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import {
  PAGE_PADDING_HORIZONTAL,
  PAGE_PADDING_TOP,
  CONTENT_BOTTOM_PADDING,
} from '@/constants/Layout';
import { useColorScheme } from '@/components/useColorScheme';
import { SearchBar } from '@/components/SearchBar';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Surface } from '@/components/ui/Surface';
import { getAllCards, getAllSets, getOrCreateDefaultSet, deleteCard } from '@/lib/db';
import type { CardRow, SetRow } from '@/lib/types';
import { useDebouncedValue } from '@/lib/useDebouncedValue';

type Section = { id: string; name: string; data: CardRow[] };

export default function LibraryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<CardRow[]>([]);
  const [sets, setSets] = useState<SetRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebouncedValue(searchQuery, 200);

  const filteredCards = useMemo(() => {
    if (!debouncedQuery.trim()) return cards;
    const q = debouncedQuery.trim().toLowerCase();
    return cards.filter(
      (c) =>
        c.front.toLowerCase().includes(q) || c.back.toLowerCase().includes(q)
    );
  }, [cards, debouncedQuery]);

  const filteredSets = useMemo(() => {
    if (!debouncedQuery.trim()) return sets;
    const q = debouncedQuery.trim().toLowerCase();
    return sets.filter((s) => s.name.toLowerCase().includes(q));
  }, [sets, debouncedQuery]);

  const sections = useMemo<Section[]>(() => {
    return filteredSets.map((s) => ({
      id: s.id,
      name: s.name,
      data: filteredCards.filter((c) => c.setId === s.id),
    }));
  }, [filteredSets, filteredCards]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await getOrCreateDefaultSet();
      const [allCards, allSets] = await Promise.all([
        getAllCards(),
        getAllSets(),
      ]);
      setCards(allCards);
      setSets(allSets);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const headerPaddingTop = Math.max(insets.top, 16) + PAGE_PADDING_TOP;
  const listPaddingBottom = CONTENT_BOTTOM_PADDING + insets.bottom;

  const rowBg = colors.surface1;
  const rowBorder = colors.border;

  const openRowActions = useCallback(
    (item: CardRow) => {
      const onEdit = () => router.push(`/edit/${item.id}`);
      const confirmDelete = () => {
        Alert.alert(
          'Delete word',
          `Remove "${item.front}" from your library? This cannot be undone.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                await deleteCard(item.id);
                load();
              },
            },
          ]
        );
      };
      if (Platform.OS === 'ios' && ActionSheetIOS) {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ['Cancel', 'Edit', 'Delete'],
            destructiveButtonIndex: 2,
            cancelButtonIndex: 0,
            title: item.front,
          },
          (index) => {
            if (index === 1) onEdit();
            else if (index === 2) confirmDelete();
          }
        );
      } else {
        Alert.alert(item.front, undefined, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Edit', onPress: onEdit },
          { text: 'Delete', style: 'destructive', onPress: confirmDelete },
        ]);
      }
    },
    [router, load]
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
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
            borderBottomColor: colors.border,
            paddingTop: headerPaddingTop,
            paddingHorizontal: PAGE_PADDING_HORIZONTAL,
          },
        ]}
      >
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Library</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {debouncedQuery.trim()
              ? `${filteredCards.length} of ${cards.length}`
              : `${cards.length} ${cards.length === 1 ? 'word' : 'words'}`}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => router.push('/explore')}
            style={({ pressed }) => [
              styles.headerIconBtn,
              { borderColor: colors.border, backgroundColor: colorScheme === 'dark' ? 'rgba(30,41,59,0.4)' : '#fff' },
              pressed && styles.btnPressed,
            ]}
            accessibilityLabel="Search all sets"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="text-search" size={20} color={primary} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/set/new')}
            style={({ pressed }) => [
              styles.newSetBtn,
              { borderColor: primary },
              pressed && styles.btnPressed,
            ]}
            accessibilityLabel="Create new set"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="folder-plus-outline" size={18} color={primary} />
            <Text style={[styles.newSetBtnText, { color: primary }]}>New set</Text>
          </Pressable>
        </View>
      </View>

      <View
        style={[
          styles.searchWrap,
          {
            paddingHorizontal: PAGE_PADDING_HORIZONTAL,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search sets, words, or meanings"
          colors={colors}
        />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        initialNumToRender={12}
        windowSize={7}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingHorizontal: PAGE_PADDING_HORIZONTAL,
            paddingBottom: listPaddingBottom,
          },
        ]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View
              style={[
                styles.emptyIconWrap,
                { backgroundColor: primary + '18' },
              ]}
            >
              <MaterialCommunityIcons
                name="book-alphabet"
                size={48}
                color={primary}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {debouncedQuery.trim()
                ? 'No matches'
                : sets.length === 0
                  ? 'No sets yet'
                  : 'No words yet'}
            </Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              {debouncedQuery.trim()
                ? 'Try a different search term.'
                : sets.length === 0
                  ? 'Create a set (e.g. Fruits, Animals) then add words to it.'
                  : 'Add your first word to start building your vocabulary list.'}
            </Text>
            {debouncedQuery.trim() ? null : sets.length === 0 ? (
              <PrimaryButton title="New set" colors={colors} onPress={() => router.push('/set/new')} style={styles.emptyCta} />
            ) : (
              <PrimaryButton title="Add word" colors={colors} onPress={() => router.push('/add')} style={styles.emptyCta} />
            )}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.name}</Text>
            <Text style={[styles.sectionCount, { color: colors.muted }]}>
              {section.data.length} {section.data.length === 1 ? 'word' : 'words'}
            </Text>
            {section.data.length > 0 && (
              <Pressable
                onPress={() => router.push(`/review/${section.id}`)}
                style={({ pressed }) => [
                  styles.sectionStudyBtn,
                  { borderColor: primary },
                  pressed && styles.btnPressed,
                ]}
              >
                <MaterialCommunityIcons name="play" size={16} color={primary} />
       
              </Pressable>
            )}
          </View>
        )}
        renderItem={({ item, index }) => (
          <Surface
            variant="cardMuted"
            colors={colors}
            style={[
              styles.row,
              {
                backgroundColor: rowBg,
                borderColor: rowBorder,
                marginTop: index === 0 ? 16 : 0,
              },
            ]}
          >
            <View style={styles.rowContent}>
              <Text style={[styles.word, { color: colors.text }]} numberOfLines={1}>
                {item.front}
              </Text>
              <Text style={[styles.meaning, { color: colors.muted }]} numberOfLines={1}>
                {item.back}
              </Text>
              {item.example ? (
                <Text
                  style={[styles.example, { color: colors.muted }]}
                  numberOfLines={2}
                >
                  {item.example}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={() => openRowActions(item)}
              style={({ pressed }) => [
                styles.rowMenu,
                pressed && styles.btnPressed,
              ]}
              hitSlop={8}
              accessibilityLabel={`Actions for ${item.front}`}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="dots-vertical" size={22} color={colors.muted} />
            </Pressable>

          </Surface>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: { ...Typography.title },
  subtitle: { ...Typography.bodySmall, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  newSetBtnText: { ...Typography.subheading },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  btnPressed: { opacity: 0.9 },
  addBtnText: { ...Typography.bodyMedium, color: '#fff' },

  searchWrap: { paddingVertical: 12, paddingBottom: 16 },

  listContent: { paddingTop: 8 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    marginTop: 16,
    borderBottomWidth: 1,
  },
  sectionTitle: { ...Typography.heading, flex: 1 },
  sectionCount: { ...Typography.bodySmall },
  sectionStudyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  sectionStudyText: { ...Typography.captionMedium },
  empty: {
    paddingVertical: 48,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: { ...Typography.titleMedium, marginBottom: 8 },
  emptyText: {
    ...Typography.bodySmall,
    textAlign: 'center',
    marginBottom: 28,
  },
  emptyCta: { marginTop: 6 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 22,
    elevation: 6,
  },
  rowContent: { flex: 1, marginRight: 8 },
  rowMenu: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginRight: 6,
  },
  word: { ...Typography.heading },
  meaning: { ...Typography.bodySmall, marginTop: 4 },
  example: {
    ...Typography.caption,
    fontStyle: 'italic',
    marginTop: 6,
    opacity: 0.9,
  },
  rowStudy: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
