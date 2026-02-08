import { useCallback, useMemo, useState } from 'react';
import {
  StyleSheet,
  Pressable,
  SectionList,
  View,
  Text,
  TextInput,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import Colors, { primary } from '@/constants/Colors';
import {
  PAGE_PADDING_HORIZONTAL,
  PAGE_PADDING_TOP,
  CONTENT_BOTTOM_PADDING,
} from '@/constants/Layout';
import { useColorScheme } from '@/components/useColorScheme';
import { getAllCards, getAllSets, getOrCreateDefaultSet, deleteCard } from '@/lib/db';
import type { CardRow, SetRow } from '@/lib/types';

type Section = { id: string; name: string; data: CardRow[] };

export default function LibraryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [cards, setCards] = useState<CardRow[]>([]);
  const [sets, setSets] = useState<SetRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return cards;
    const q = searchQuery.trim().toLowerCase();
    return cards.filter(
      (c) =>
        c.front.toLowerCase().includes(q) || c.back.toLowerCase().includes(q)
    );
  }, [cards, searchQuery]);

  const sections = useMemo<Section[]>(() => {
    return sets.map((s) => ({
      id: s.id,
      name: s.name,
      data: filteredCards.filter((c) => c.setId === s.id),
    }));
  }, [sets, filteredCards]);

  const load = useCallback(async () => {
    await getOrCreateDefaultSet();
    const [allCards, allSets] = await Promise.all([
      getAllCards(),
      getAllSets(),
    ]);
    setCards(allCards);
    setSets(allSets);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const headerPaddingTop = Math.max(insets.top, 16) + PAGE_PADDING_TOP;
  const listPaddingBottom = CONTENT_BOTTOM_PADDING + insets.bottom;

  const rowBg =
    colorScheme === 'dark' ? 'rgba(30,41,59,0.4)' : '#fff';
  const rowBorder = colorScheme === 'dark' ? '#334155' : '#f1f5f9';

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
            {searchQuery.trim()
              ? `${filteredCards.length} of ${cards.length}`
              : `${cards.length} ${cards.length === 1 ? 'word' : 'words'}`}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => router.push('/set/new')}
            style={({ pressed }) => [
              styles.newSetBtn,
              { borderColor: primary },
              pressed && styles.btnPressed,
            ]}
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
        <View
          style={[
            styles.searchInputWrap,
            {
              backgroundColor: colorScheme === 'dark' ? 'rgba(30,41,59,0.5)' : '#f1f5f9',
              borderColor: colors.border,
            },
          ]}
        >
          <MaterialCommunityIcons name="magnify" size={20} color={colors.muted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search words or meanings..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <MaterialCommunityIcons name="close-circle" size={20} color={colors.muted} />
            </Pressable>
          )}
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
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
              {sets.length === 0 ? 'No sets yet' : 'No words yet'}
            </Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              {sets.length === 0
                ? 'Create a set (e.g. Fruits, Animals) then add words to it.'
                : 'Add your first word to start building your vocabulary list.'}
            </Text>
            {sets.length === 0 ? (
              <Pressable
                onPress={() => router.push('/set/new')}
                style={({ pressed }) => [
                  styles.emptyCta,
                  { backgroundColor: primary },
                  pressed && styles.btnPressed,
                ]}
              >
                <MaterialCommunityIcons name="folder-plus-outline" size={20} color="#fff" />
                <Text style={styles.emptyCtaText}>New set</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => router.push('/add')}
                style={({ pressed }) => [
                  styles.emptyCta,
                  { backgroundColor: primary },
                  pressed && styles.btnPressed,
                ]}
              >
                <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                <Text style={styles.emptyCtaText}>Add word</Text>
              </Pressable>
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
          <View
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
            >
              <MaterialCommunityIcons name="dots-vertical" size={22} color={colors.muted} />
            </Pressable>

          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 14, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  newSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  newSetBtnText: { fontWeight: '700', fontSize: 14 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  btnPressed: { opacity: 0.9 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  searchWrap: { paddingVertical: 12, paddingBottom: 16},
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 0 },

  listContent: { paddingTop: 8 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    marginTop: 16,
    borderBottomWidth: 1,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', flex: 1 },
  sectionCount: { fontSize: 13 },
  sectionStudyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  sectionStudyText: { fontSize: 12, fontWeight: '700' },
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
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  emptyCtaText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
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
  word: { fontSize: 17, fontWeight: '700' },
  meaning: { fontSize: 15, marginTop: 4 },
  example: {
    fontSize: 13,
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
