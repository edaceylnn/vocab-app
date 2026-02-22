import { useCallback, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, useWindowDimensions, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useColorScheme } from '@/components/useColorScheme';
import Colors, { primary } from '@/constants/Colors';
import { PAGE_PADDING_HORIZONTAL, PAGE_PADDING_TOP, CONTENT_BOTTOM_PADDING } from '@/constants/Layout';
import { getTotalCardCount, getTodayReviewedCount, getAllSets, getSetCardCount } from '@/lib/db';

const DEFAULT_DAILY_GOAL = 30;

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [loading, setLoading] = useState(true);
  const [totalWords, setTotalWords] = useState(0);
  const [reviewedToday, setReviewedToday] = useState(0);
  const [setCounts, setSetCounts] = useState<{ name: string; count: number }[]>([]);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const [total, today, sets] = await Promise.all([
        getTotalCardCount(),
        getTodayReviewedCount(),
        getAllSets(),
      ]);
      setTotalWords(total);
      setReviewedToday(today);
      const counts = await Promise.all(
        sets.slice(0, 5).map(async (s) => ({
          name: s.name,
          count: await getSetCardCount(s.id),
        }))
      );
      setSetCounts(counts);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const headerPaddingTop = Math.max(insets.top, 16) + PAGE_PADDING_TOP;
  const contentPaddingBottom = CONTENT_BOTTOM_PADDING + insets.bottom;
  const maxWidth = width > 480 ? 480 : undefined;
  const pct = DEFAULT_DAILY_GOAL > 0
    ? Math.round((Math.min(reviewedToday, DEFAULT_DAILY_GOAL) / DEFAULT_DAILY_GOAL) * 100)
    : 0;

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: PAGE_PADDING_HORIZONTAL,
            paddingTop: headerPaddingTop,
            paddingBottom: contentPaddingBottom,
            maxWidth,
            alignSelf: width > 480 ? 'center' : 'stretch',
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>Progress</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Your learning at a glance
        </Text>

        <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? 'rgba(30,41,59,0.4)' : '#fff', borderColor: colorScheme === 'dark' ? '#334155' : '#f1f5f9' }]}>
          <View style={[styles.cardRow, { borderColor: colors.border }]}>
            <MaterialCommunityIcons name="book-open-variant" size={24} color={primary} />
            <Text style={[styles.cardLabel, { color: colors.muted }]}>Total words</Text>
            <Text style={[styles.cardValue, { color: colors.text }]}>{totalWords}</Text>
          </View>
          <View style={[styles.cardRow, { borderColor: colors.border }]}>
            <MaterialCommunityIcons name="check-circle-outline" size={24} color={primary} />
            <Text style={[styles.cardLabel, { color: colors.muted }]}>Reviewed today</Text>
            <Text style={[styles.cardValue, { color: colors.text }]}>{reviewedToday}</Text>
          </View>
          <View style={[styles.cardRow, { borderColor: colors.border }]}>
            <MaterialCommunityIcons name="target" size={24} color={primary} />
            <Text style={[styles.cardLabel, { color: colors.muted }]}>Daily goal</Text>
            <Text style={[styles.cardValue, { color: colors.text }]}>{pct}%</Text>
          </View>
        </View>

        {setCounts.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>By set</Text>
            <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? 'rgba(30,41,59,0.4)' : '#fff', borderColor: colorScheme === 'dark' ? '#334155' : '#f1f5f9' }]}>
              {setCounts.map(({ name, count }) => (
                <View key={name} style={[styles.cardRow, { borderColor: colors.border }]}>
                  <MaterialCommunityIcons name="folder-outline" size={22} color={colors.muted} />
                  <Text style={[styles.cardLabel, { color: colors.text }]}>{name}</Text>
                  <Text style={[styles.cardValue, { color: colors.muted }]}>{count}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: {},
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 14, marginTop: 4, marginBottom: 24 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  cardLabel: { flex: 1, fontSize: 15 },
  cardValue: { fontSize: 16, fontWeight: '700' },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 24, marginBottom: 12 },
});
