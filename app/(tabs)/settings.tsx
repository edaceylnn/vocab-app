import { useCallback, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, useWindowDimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { PAGE_PADDING_HORIZONTAL, PAGE_PADDING_TOP, CONTENT_BOTTOM_PADDING } from '@/constants/Layout';
import { getTotalCardCount, getTodayReviewedCount } from '@/lib/db';

const DEFAULT_DAILY_GOAL = 30;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [totalWords, setTotalWords] = useState(0);
  const [reviewedToday, setReviewedToday] = useState(0);

  const loadStats = useCallback(async () => {
    const [total, today] = await Promise.all([
      getTotalCardCount(),
      getTodayReviewedCount(),
    ]);
    setTotalWords(total);
    setReviewedToday(today);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const headerPaddingTop = Math.max(insets.top, 16) + PAGE_PADDING_TOP;
  const contentPaddingBottom = CONTENT_BOTTOM_PADDING + insets.bottom;
  const maxWidth = width > 480 ? 480 : undefined;

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
        <View style={[styles.profileBlock, { backgroundColor: 'transparent' }]}>
          <View style={[styles.avatarWrap, { backgroundColor: colors.border }]}>
            <MaterialCommunityIcons name="account-circle" size={64} color={colors.muted} />
          </View>
          <Text style={[styles.profileTitle, { color: colors.text }]}>Vocabulary Learner</Text>
          <View style={[styles.statsRow, { backgroundColor: 'transparent' }]}>
            <View style={[styles.statChip, { backgroundColor: colorScheme === 'dark' ? 'rgba(30,41,59,0.5)' : '#f1f5f9' }]}>
              <MaterialCommunityIcons name="book-open-variant" size={18} color={colors.muted} />
              <Text style={[styles.statText, { color: colors.text }]}>{totalWords} words</Text>
            </View>
            <View style={[styles.statChip, { backgroundColor: colorScheme === 'dark' ? 'rgba(30,41,59,0.5)' : '#f1f5f9' }]}>
              <MaterialCommunityIcons name="check-circle-outline" size={18} color={colors.muted} />
              <Text style={[styles.statText, { color: colors.text }]}>{reviewedToday} today</Text>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: 'transparent' }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>Learning</Text>
          <View style={[styles.row, { borderColor: colors.border, backgroundColor: colorScheme === 'dark' ? 'rgba(30,41,59,0.3)' : '#fff' }]}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Daily goal</Text>
            <Text style={[styles.rowValue, { color: colors.muted }]}>{DEFAULT_DAILY_GOAL} cards</Text>
          </View>
          <Text style={[styles.hint, { color: colors.muted }]}>Editable in a future update.</Text>
        </View>

        <View style={[styles.section, { backgroundColor: 'transparent' }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>App</Text>
          <View style={[styles.row, { borderColor: colors.border, backgroundColor: colorScheme === 'dark' ? 'rgba(30,41,59,0.3)' : '#fff' }]}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Version</Text>
            <Text style={[styles.rowValue, { color: colors.muted }]}>1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {},
  profileBlock: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  avatarWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileTitle: { fontSize: 20, fontWeight: '700', marginTop: 16 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  statText: { fontSize: 14, fontWeight: '600' },

  section: { marginTop: 32 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  rowLabel: { fontSize: 16, fontWeight: '500' },
  rowValue: { fontSize: 15 },
  hint: { fontSize: 13, marginTop: 8 },
});
