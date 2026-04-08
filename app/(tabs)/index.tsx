import { StyleSheet, Pressable, ScrollView, Text, View, useWindowDimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Colors, { primary } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { PAGE_PADDING_HORIZONTAL, PAGE_PADDING_TOP, CONTENT_BOTTOM_PADDING } from '@/constants/Layout';
import { useColorScheme } from '@/components/useColorScheme';
import { hapticLight } from '@/lib/haptics';
import { Surface } from '@/components/ui/Surface';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useDailyGoal, useDailyStats } from '@/lib/hooks';

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
  const { goal } = useDailyGoal();
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

        <Surface variant="card" colors={colors} style={styles.goalCard}>
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
        </Surface>

        <PrimaryButton
          title={`Start Learning (${totalInLibrary} cards)`}
          colors={colors}
          onPress={() => {
            hapticLight();
            router.push('/review/all');
          }}
          style={styles.primaryCta}
        />

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
                    backgroundColor: colors.surface1,
                    borderColor: colors.border,
                    shadowColor: colors.shadow,
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
  dateLabel: { ...Typography.captionUppercase },
  title: { ...Typography.title, marginTop: 2 },
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
  circularValue: { ...Typography.numericLarge },
  circularLabel: { ...Typography.captionMedium, marginTop: 2 },
  goalBarWrap: { width: '80%', marginTop: 16, height: 6, borderRadius: 3, overflow: 'hidden' },
  goalBarBg: { flex: 1, borderRadius: 3, flexDirection: 'row' },
  goalBarFill: { height: '100%', borderRadius: 3 },
  goalText: { ...Typography.bodySmallMedium, marginTop: 8 },
  goalSubtext: { ...Typography.caption, marginTop: 4 },

  ctaLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  ctaIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTitle: { ...Typography.heading, color: '#fff' },
  ctaSubtitle: { ...Typography.bodySmall, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  ctaBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  ctaBadgeText: { ...Typography.captionMedium, color: '#fff' },
  emptyHint: { ...Typography.bodySmall, marginTop: 16, textAlign: 'center' },
  primaryCta: {
    marginTop: 32,
  },

  statsRow: { marginTop: 24, alignItems: 'center' },
  statsText: { ...Typography.bodySmallMedium },

  categoriesSection: { marginTop: 28 },
  categoriesTitle: { ...Typography.heading, marginBottom: 12 },
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
  setRowName: { ...Typography.subheading, flex: 1 },
  setRowCount: { ...Typography.bodySmall },

  deco: { position: 'absolute', width: 200, height: 200, borderRadius: 100, zIndex: -1 },
  decoTop: { top: -40, left: -40 },
  decoBottom: { bottom: -40, right: -40 },
});
