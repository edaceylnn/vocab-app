import { StyleSheet, Pressable, ScrollView, useWindowDimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { Text, View } from '@/components/Themed';
import Colors, { primary } from '@/constants/Colors';
import { PAGE_PADDING_HORIZONTAL, PAGE_PADDING_TOP, CONTENT_BOTTOM_PADDING } from '@/constants/Layout';
import { useColorScheme } from '@/components/useColorScheme';
import { useDailyStats } from '@/lib/hooks';

const DEFAULT_DAILY_GOAL = 30;

function formatDate() {
  const d = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

export default function DailyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const {
    totalCards,
    reviewedToday,
    totalInLibrary,
    recentSets,
    loading,
  } = useDailyStats();

  const goal = DEFAULT_DAILY_GOAL;
  const completed = Math.min(reviewedToday, goal);
  const pct = goal > 0 ? Math.round((completed / goal) * 100) : 0;
  const remaining = Math.max(0, goal - completed);

  const contentPaddingBottom = CONTENT_BOTTOM_PADDING + insets.bottom;
  const headerPaddingTop = Math.max(insets.top, 16) + PAGE_PADDING_TOP;

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
            paddingBottom: contentPaddingBottom,
            maxWidth: width > 480 ? 480 : undefined,
            alignSelf: width > 480 ? 'center' : 'stretch',
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { backgroundColor: 'transparent', paddingTop: headerPaddingTop }]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.dateLabel, { color: colors.muted }]}>
              {formatDate()}
            </Text>
            <Text style={[styles.title, { color: colors.text }]}>Daily Progress</Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable
              onPress={() => router.push('/add')}
              style={styles.addBtn}
              accessibilityLabel="Add new word"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="plus" size={22} color={primary} />
            </Pressable>
          </View>
        </View>

        <View
          style={[
            styles.goalCard,
            {
              backgroundColor: colorScheme === 'dark' ? 'rgba(30,41,59,0.4)' : '#fff',
              borderColor: colorScheme === 'dark' ? '#334155' : '#f1f5f9',
            },
          ]}
        >
          <View style={[styles.circularWrap, { backgroundColor: 'transparent' }]}>
            <View style={[styles.circularBg, { borderColor: colors.border, backgroundColor: 'transparent' }]}>
              <Text style={[styles.circularValue, { color: colors.text }]}>
                {completed}/{goal}
              </Text>
              <Text style={[styles.circularLabel, { color: colors.muted }]}>Cards</Text>
            </View>
          </View>
          <View style={[styles.goalBarWrap, { backgroundColor: 'transparent' }]}>
            <View style={[styles.goalBarBg, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.goalBarFill,
                  { width: `${pct}%`, backgroundColor: primary },
                ]}
              />
            </View>
          </View>
          <Text style={[styles.goalText, { color: colors.muted }]}>
            Daily Goal: {pct}% complete
          </Text>
          {remaining > 0 && (
            <Text style={[styles.goalSubtext, { color: colors.muted }]}>
              {remaining} more cards to reach your streak!
            </Text>
          )}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.cta,
            pressed && styles.ctaPressed,
          ]}
          onPress={() => router.push('/review/all')}
          accessibilityLabel="Start learning. Total cards in library."
          accessibilityRole="button"
        >
          <View style={[styles.ctaLeft, { backgroundColor: 'transparent' }]}>
            <View style={styles.ctaIconWrap}>
              <MaterialCommunityIcons name="play" size={28} color="#fff" />
            </View>
            <View style={{ backgroundColor: 'transparent' }}>
              <Text style={styles.ctaTitle}>Start Learning</Text>
            </View>
          </View>
            <View style={styles.ctaBadge}>
              <Text style={styles.ctaBadgeText}>{totalInLibrary} cards</Text>
            </View>
        </Pressable>

        {totalInLibrary === 0 && (
          <Text style={[styles.emptyHint, { color: colors.muted }]}>
            No cards yet. Add your first word to get started.
          </Text>
        )}

        {recentSets.length > 0 && (
          <View style={[styles.categoriesSection, { backgroundColor: 'transparent' }]}>
            <Text style={[styles.categoriesTitle, { color: colors.text }]}>
              Categories
            </Text>
            {recentSets.map((set) => (
              <Pressable
                key={set.id}
                style={({ pressed }) => [
                  styles.setRow,
                  {
                    backgroundColor: colorScheme === 'dark' ? 'rgba(30,41,59,0.4)' : '#fff',
                    borderColor: colorScheme === 'dark' ? '#334155' : '#f1f5f9',
                  },
                  pressed && styles.setRowPressed,
                ]}
                onPress={() => router.push(`/review/${set.id}`)}
                accessibilityLabel={`Review set ${set.name}, ${set.count} words`}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name="folder-outline" size={22} color={primary} />
                <Text style={[styles.setRowName, { color: colors.text }]} numberOfLines={1}>
                  {set.name}
                </Text>
                <Text style={[styles.setRowCount, { color: colors.muted }]}>
                  {set.count} {set.count === 1 ? 'word' : 'words'}
                </Text>
                <MaterialCommunityIcons name="play-circle-outline" size={22} color={primary} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <View
        style={[
          styles.deco,
          styles.decoTop,
          { backgroundColor: primary, opacity: 0.05 },
        ]}
      />
      <View
        style={[
          styles.deco,
          styles.decoBottom,
          { backgroundColor: primary, opacity: 0.05 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  headerLeft: {},
  dateLabel: { fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 2 },
  title: { fontSize: 24, fontWeight: '700', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  addBtn: { padding: 4 },

  goalCard: {
    marginTop: 16,
    borderRadius: 24,
    borderWidth: 1,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  circularWrap: { alignItems: 'center', justifyContent: 'center' },
  circularBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularValue: { fontSize: 28, fontWeight: '700' },
  circularLabel: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  goalBarWrap: { width: '80%', marginTop: 16, height: 6, borderRadius: 3, overflow: 'hidden' },
  goalBarBg: { flex: 1, borderRadius: 3, flexDirection: 'row' },
  goalBarFill: { height: '100%', borderRadius: 3 },
  goalText: { marginTop: 8, fontWeight: '500' },
  goalSubtext: { fontSize: 12, marginTop: 4 },

  cta: {
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: primary,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaPressed: { opacity: 0.95, transform: [{ scale: 0.98 }] },
  ctaLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  ctaIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  ctaSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 2 },
  ctaBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  ctaBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  emptyHint: { marginTop: 16, textAlign: 'center', fontSize: 14 },

  statsRow: { marginTop: 24, alignItems: 'center' },
  statsText: { fontSize: 13, fontWeight: '500' },

  categoriesSection: { marginTop: 28 },
  categoriesTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  setRowPressed: { opacity: 0.9 },
  setRowName: { flex: 1, fontSize: 16, fontWeight: '600' },
  setRowCount: { fontSize: 14 },

  deco: { position: 'absolute', width: 200, height: 200, borderRadius: 100, zIndex: -1 },
  decoTop: { top: -40, left: -40 },
  decoBottom: { bottom: -40, right: -40 },
});
