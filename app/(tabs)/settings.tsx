import { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useColorScheme } from '@/components/useColorScheme';
import Colors, { primary } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { PAGE_PADDING_HORIZONTAL, PAGE_PADDING_TOP, CONTENT_BOTTOM_PADDING } from '@/constants/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { getDailyGoal, setDailyGoal } from '@/lib/dailyGoalStorage';
import { getTotalCardCount, getTodayReviewedCount } from '@/lib/db';
import { Surface } from '@/components/ui/Surface';

const USE_API = !!process.env.EXPO_PUBLIC_API_URL;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totalWords, setTotalWords] = useState(0);
  const [reviewedToday, setReviewedToday] = useState(0);
  const [dailyGoal, setDailyGoalState] = useState(30);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const [total, today, goal] = await Promise.all([
        getTotalCardCount(),
        getTodayReviewedCount(),
        getDailyGoal(),
      ]);
      setTotalWords(total);
      setReviewedToday(today);
      setDailyGoalState(goal);
    } finally {
      setLoading(false);
    }
  }, []);

  const bumpGoal = async (delta: number) => {
    const next = Math.max(1, Math.min(500, dailyGoal + delta));
    await setDailyGoal(next);
    setDailyGoalState(next);
  };

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const headerPaddingTop = Math.max(insets.top, 16) + PAGE_PADDING_TOP;
  const contentPaddingBottom = CONTENT_BOTTOM_PADDING + insets.bottom;
  const maxWidth = width > 480 ? 480 : undefined;

  const onSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
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
        <View style={[styles.profileBlock, { backgroundColor: 'transparent' }]}>
          <View style={[styles.avatarWrap, { backgroundColor: colors.border }]}>
            <MaterialCommunityIcons name="account-circle" size={64} color={colors.muted} />
          </View>
          <Text style={[styles.profileTitle, { color: colors.text }]}>Vocabulary Learner</Text>
          {USE_API && user ? (
            <Text style={[styles.emailLine, { color: colors.muted }]} numberOfLines={1}>
              {user.email}
            </Text>
          ) : null}
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

        {USE_API ? (
          <View style={[styles.section, { backgroundColor: 'transparent' }]}>
            <Text style={[styles.sectionTitle, { color: colors.muted }]}>Account</Text>
            <Pressable
              onPress={onSignOut}
              style={({ pressed }) => [
                styles.signOutRow,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surface1,
                  shadowColor: colors.shadow,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Text style={[styles.signOutText, { color: primary }]}>Sign out</Text>
              <MaterialCommunityIcons name="logout" size={20} color={primary} />
            </Pressable>
          </View>
        ) : null}

        <View style={[styles.section, { backgroundColor: 'transparent' }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>Learning</Text>
          <Surface
            variant="cardMuted"
            colors={colors}
            style={[
              styles.goalRow,
              {
                backgroundColor: colors.surface1,
              },
            ]}
          >
            <Text style={[styles.rowLabel, { color: colors.text }]}>Daily goal</Text>
            <View style={styles.goalControls}>
              <Pressable
                onPress={() => bumpGoal(-1)}
                style={({ pressed }) => [
                  styles.goalBtn,
                  { borderColor: colors.border, opacity: pressed ? 0.75 : 1 },
                ]}
                disabled={dailyGoal <= 1}
                accessibilityLabel="Decrease daily goal"
              >
                <MaterialCommunityIcons name="minus" size={22} color={dailyGoal <= 1 ? colors.muted : primary} />
              </Pressable>
              <Text style={[styles.goalValue, { color: colors.text }]}>{dailyGoal}</Text>
              <Pressable
                onPress={() => bumpGoal(1)}
                style={({ pressed }) => [
                  styles.goalBtn,
                  { borderColor: colors.border, opacity: pressed ? 0.75 : 1 },
                ]}
                disabled={dailyGoal >= 500}
                accessibilityLabel="Increase daily goal"
              >
                <MaterialCommunityIcons name="plus" size={22} color={dailyGoal >= 500 ? colors.muted : primary} />
              </Pressable>
              <Text style={[styles.goalSuffix, { color: colors.muted }]}>cards</Text>
            </View>
          </Surface>
        </View>

        <View style={[styles.section, { backgroundColor: 'transparent' }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>App</Text>
          <Surface variant="cardMuted" colors={colors} style={[styles.row, { backgroundColor: colors.surface1 }]}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Version</Text>
            <Text style={[styles.rowValue, { color: colors.muted }]}>1.0.0</Text>
          </Surface>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
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
  profileTitle: { ...Typography.titleMedium, marginTop: 16 },
  emailLine: { ...Typography.bodySmall, marginTop: 6, maxWidth: '100%' },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  statText: { ...Typography.bodySmallMedium },

  section: { marginTop: 32 },
  sectionTitle: {
    ...Typography.sectionLabel,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowLabel: { ...Typography.body },
  rowValue: { ...Typography.bodySmall },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    flexWrap: 'wrap',
    gap: 12,
  },
  goalControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  goalBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalValue: { ...Typography.numeric, minWidth: 36, textAlign: 'center' },
  goalSuffix: { ...Typography.bodySmall },
  hint: { fontSize: 13, marginTop: 8 },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  signOutText: { ...Typography.subheading },
});
