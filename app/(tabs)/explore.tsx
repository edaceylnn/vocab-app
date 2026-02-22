import { useCallback, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useColorScheme } from '@/components/useColorScheme';
import Colors, { primary } from '@/constants/Colors';
import {
  PAGE_PADDING_HORIZONTAL,
  PAGE_PADDING_TOP,
  CONTENT_BOTTOM_PADDING,
} from '@/constants/Layout';
import { getAllCards, getAllSets } from '@/lib/db';
import type { CardRow, SetRow } from '@/lib/types';

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<CardRow[]>([]);
  const [sets, setSets] = useState<SetRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
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

  const setByName = useMemo(() => {
    const m: Record<string, string> = {};
    for (const s of sets) m[s.id] = s.name;
    return m;
  }, [sets]);

  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.trim().toLowerCase();
    return cards.filter(
      (c) =>
        c.front.toLowerCase().includes(q) ||
        c.back.toLowerCase().includes(q) ||
        (c.example?.toLowerCase().includes(q) ?? false)
    );
  }, [cards, searchQuery]);

  const paddingTop = Math.max(insets.top, 16) + PAGE_PADDING_TOP;
  const paddingBottom = CONTENT_BOTTOM_PADDING + insets.bottom;

  const renderItem = useCallback(
    ({ item }: { item: CardRow }) => {
      const setName = setByName[item.setId] ?? 'Unknown';
      return (
        <Pressable
          style={({ pressed }) => [
            styles.row,
            {
              backgroundColor: colorScheme === 'dark' ? 'rgba(30,41,59,0.4)' : '#fff',
              borderColor: colorScheme === 'dark' ? '#334155' : '#f1f5f9',
            },
            pressed && styles.rowPressed,
          ]}
          onPress={() => router.push(`/edit/${item.id}`)}
        >
          <View style={styles.rowMain}>
            <Text style={[styles.rowFront, { color: colors.text }]} numberOfLines={1}>
              {item.front}
            </Text>
            <Text style={[styles.rowBack, { color: colors.muted }]} numberOfLines={1}>
              {item.back}
            </Text>
          </View>
          <Text style={[styles.rowSet, { color: colors.muted }]} numberOfLines={1}>
            {setName}
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.muted} />
        </Pressable>
      );
    },
    [colorScheme, colors, setByName, router]
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
            paddingTop,
            paddingHorizontal: PAGE_PADDING_HORIZONTAL,
            paddingBottom: 12,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]}>Explore</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Search across all sets
        </Text>
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

      {!searchQuery.trim() ? (
        <View style={[styles.empty, { paddingHorizontal: PAGE_PADDING_HORIZONTAL, paddingTop: 24 }]}>
          <MaterialCommunityIcons name="magnify" size={48} color={colors.muted} />
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            Type above to search across all your words and sets.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredCards}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingHorizontal: PAGE_PADDING_HORIZONTAL,
              paddingBottom: paddingBottom,
            },
          ]}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                No words match your search.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  header: { borderBottomWidth: 1 },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 14, marginTop: 4 },
  searchWrap: { paddingVertical: 12, borderBottomWidth: 1 },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: { flex: 1, height: 44, fontSize: 16 },
  listContent: { paddingTop: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  rowPressed: { opacity: 0.9 },
  rowMain: { flex: 1, minWidth: 0 },
  rowFront: { fontSize: 16, fontWeight: '600' },
  rowBack: { fontSize: 14, marginTop: 2 },
  rowSet: { fontSize: 12, maxWidth: 100 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 15, textAlign: 'center', marginTop: 12 },
});
