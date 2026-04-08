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
import { Typography } from '@/constants/Typography';
import {
  PAGE_PADDING_HORIZONTAL,
  PAGE_PADDING_TOP,
  CONTENT_BOTTOM_PADDING,
} from '@/constants/Layout';
import { getAllCards, getAllSets } from '@/lib/db';
import type { CardRow, SetRow } from '@/lib/types';
import { Surface } from '@/components/ui/Surface';

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<CardRow[]>([]);
  const [sets, setSets] = useState<SetRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'cards' | 'sets' | 'notes'>('all');

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

  const goBack = useCallback(() => {
    router.replace('/library');
  }, [router]);

  const renderItem = useCallback(
    ({ item }: { item: CardRow }) => {
      const setName = setByName[item.setId] ?? 'Unknown';
      return (
        <Pressable
          style={({ pressed }) => [
            styles.row,
            {
              backgroundColor: colors.surface1,
              borderColor: 'transparent',
              shadowColor: colors.shadow,
              opacity: pressed ? 0.94 : 1,
            },
          ]}
          onPress={() => router.push(`/edit/${item.id}`)}
        >
          <View style={styles.rowIcon}>
            <MaterialCommunityIcons name="book-open-variant" size={24} color={primary} />
          </View>
          <View style={styles.rowMain}>
            <Text style={[styles.badge, { color: colors.primary, backgroundColor: colors.surface3 }]}>Card</Text>
            <Text style={[styles.rowFront, { color: colors.text }]} numberOfLines={1}>
              {item.front}
            </Text>
            <Text style={[styles.rowBack, { color: colors.muted }]} numberOfLines={2}>
              {item.back}
            </Text>
            <Text style={[styles.rowSet, { color: colors.muted }]} numberOfLines={1}>
              in Set: <Text style={{ color: colors.text }}>{setName}</Text>
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
        </Pressable>
      );
    },
    [colorScheme, colors, setByName, router]
  );

  const headerBlock = (
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
      <View style={styles.headerRow}>
        <Pressable
          onPress={goBack}
          hitSlop={12}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
        </Pressable>
        <View style={styles.headerTitles}>
          <Text style={[styles.title, { color: colors.text }]}>Explore</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Search across all sets
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {headerBlock}
        <View style={[styles.centered, { flex: 1 }]}>
          <ActivityIndicator size="large" color={primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {headerBlock}

      <View
        style={[
          styles.searchWrap,
          {
            paddingHorizontal: PAGE_PADDING_HORIZONTAL,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Surface variant="input" colors={colors} style={styles.searchInputWrap}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.muted} />
          <TextInput
            style={[styles.searchInput, Typography.input, { color: colors.text }]}
            placeholder="Search all sets and cards..."
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
        </Surface>
      </View>

      <View style={[styles.chipsRow, { paddingHorizontal: PAGE_PADDING_HORIZONTAL }]}>
        {([
          { id: 'all', label: 'All' },
          { id: 'cards', label: 'Cards' },
          { id: 'sets', label: 'Sets' },
          { id: 'notes', label: 'Notes' },
        ] as const).map((c) => {
          const active = filter === c.id;
          return (
            <Pressable
              key={c.id}
              onPress={() => setFilter(c.id)}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: active ? colors.primary : colors.surface1,
                  opacity: pressed ? 0.92 : 1,
                },
              ]}
            >
              <Text style={[styles.chipText, { color: active ? '#fff' : colors.muted }]}>{c.label}</Text>
            </Pressable>
          );
        })}
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
          data={filter === 'all' || filter === 'cards' ? filteredCards : []}
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
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backBtn: { marginRight: 4, marginLeft: -4 },
  backBtnPressed: { opacity: 0.6 },
  headerTitles: { flex: 1, minWidth: 0 },
  title: { ...Typography.title },
  subtitle: { ...Typography.bodySmall, marginTop: 4 },
  searchWrap: { paddingVertical: 12, borderBottomWidth: 1 },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 18,
    gap: 10,
    height: 64,
  },
  searchInput: { flex: 1, height: 44 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingTop: 12, paddingBottom: 10 },
  chip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999 },
  chipText: { ...Typography.captionMedium, textTransform: 'none', letterSpacing: 0 },
  listContent: { paddingTop: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 24,
    marginBottom: 8,
    gap: 12,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 32,
    elevation: 8,
  },
  rowIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(219, 225, 255, 0.45)' },
  rowMain: { flex: 1, minWidth: 0 },
  badge: { ...Typography.captionUppercase, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginBottom: 8 },
  rowFront: { ...Typography.titleLarge },
  rowBack: { ...Typography.bodySmall, marginTop: 6 },
  rowSet: { ...Typography.caption, marginTop: 8 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32 },
  emptyText: { ...Typography.bodySmall, textAlign: 'center', marginTop: 12 },
});
