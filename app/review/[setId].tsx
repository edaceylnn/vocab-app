import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import Colors, { primary } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useColorScheme } from '@/components/useColorScheme';
import { getDailyGoal } from '@/lib/dailyGoalStorage';
import { hapticLight, hapticMedium } from '@/lib/haptics';
import { getCardsForStudy, getAllCards, getTodayReviewedCount, markCardReviewed } from '@/lib/db';
import type { CardRow } from '@/lib/types';

function shuffleCards<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function ReviewScreen() {
  const { setId } = useLocalSearchParams<{ setId: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [cards, setCards] = useState<CardRow[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewedToday, setReviewedToday] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(30);
  const flipAnim = useState(() => new Animated.Value(0))[0];

  const card = cards[index];
  const progress = cards.length > 0 ? reviewedToday + index : 0;

  const loadCards = useCallback(async () => {
    if (!setId) return;
    const list =
      setId === 'all'
        ? shuffleCards(await getAllCards())
        : await getCardsForStudy(setId);
    setCards(list);
    setIndex(0);
    setFlipped(false);
    flipAnim.setValue(0);
    const count = await getTodayReviewedCount();
    setReviewedToday(count);
  }, [setId, flipAnim]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  useEffect(() => {
    getDailyGoal().then(setDailyGoal);
  }, []);

  const flip = useCallback(() => {
    hapticLight();
    const toBack = !flipped;
    setFlipped(toBack);
    Animated.spring(flipAnim, {
      toValue: toBack ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 80,
    }).start();
  }, [flipped, flipAnim]);

  const handleNext = useCallback(async () => {
    if (!card) return;
    hapticMedium();
    await markCardReviewed(card.id);
    const next = index + 1;
    if (next >= cards.length) {
      router.back();
      return;
    }
    setIndex(next);
    setFlipped(false);
    flipAnim.setValue(0);
    setReviewedToday((c) => c + 1);
  }, [card, index, cards.length, router, flipAnim]);

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  if (!card && cards.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerBtn}>
            <MaterialCommunityIcons name="close" size={24} color={colors.muted} />
          </Pressable>
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            No cards in this set.
          </Text>
          <Pressable onPress={() => router.back()} style={styles.headerBtn}>
            <MaterialCommunityIcons name="chart-box-outline" size={24} color={colors.muted} />
          </Pressable>
        </View>
        <View style={styles.centered}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>All done!</Text>
          <Pressable
            style={[styles.backBtn, { backgroundColor: primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backBtnText}>Back to Daily</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!card) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.headerBtn}
          accessibilityLabel="Close"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="close" size={24} color={colors.muted} />
        </Pressable>
        <View style={styles.progressWrap}>
          <View style={styles.progressRow}>
            <Text style={[styles.progressLabel, { color: colors.muted }]}>Daily Goal</Text>
            <Text style={[styles.progressValue, { color: primary }]}>
              {progress}/{dailyGoal}
            </Text>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${dailyGoal > 0 ? Math.min(100, (progress / dailyGoal) * 100) : 0}%`,
                  backgroundColor: primary,
                },
              ]}
            />
          </View>
        </View>
        <Pressable style={styles.headerBtn}>
          <MaterialCommunityIcons name="chart-box-outline" size={24} color={colors.muted} />
        </Pressable>
      </View>

      <Pressable
        style={styles.cardArea}
        onPress={flip}
        accessibilityLabel={flipped ? 'Show word again' : 'Reveal meaning'}
        accessibilityRole="button"
      >
        <Animated.View
          style={[
            styles.card,
            styles.cardFront,
            {
              backgroundColor: colorScheme === 'dark' ? '#192233' : '#fff',
              borderColor: colors.border,
            },
            {
              transform: [{ rotateY: frontInterpolate }],
            },
          ]}
        >
          <Text style={[styles.cardFrontLabel, { color: colors.muted }]}>Front</Text>
          <Text style={[styles.cardWord, { color: colors.text }]}>{card.front}</Text>
          <Text style={[styles.tapHint, { color: colors.muted }]}>Tap to reveal meaning</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.card,
            styles.cardBack,
            {
              backgroundColor: colorScheme === 'dark' ? 'rgba(19,91,236,0.15)' : 'rgba(19,91,236,0.08)',
              borderColor: 'rgba(19,91,236,0.3)',
            },
            {
              transform: [{ rotateY: backInterpolate }],
            },
          ]}
        >
          <Text style={styles.cardBackLabel}>Meaning</Text>
          <Text style={styles.cardMeaning}>{card.back}</Text>
          {card.example ? (
            <Text style={[styles.cardExample, { color: colors.muted }]} numberOfLines={3}>
              "{card.example}"
            </Text>
          ) : null}
          <Text style={[styles.tapHint, styles.tapHintBack, { color: colors.muted }]}>
            Tap to see word again
          </Text>
        </Animated.View>
      </Pressable>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Pressable
          style={[styles.nextBtn, { backgroundColor: primary }]}
          onPress={handleNext}
          accessibilityLabel="Next card"
          accessibilityRole="button"
        >
          <Text style={styles.nextBtnText}>Next</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerBtn: { padding: 8 },
  progressWrap: { flex: 1, paddingHorizontal: 24 },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: { ...Typography.captionMedium },
  progressValue: { ...Typography.captionBold },
  progressBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },

  emptyText: { ...Typography.bodySmall, flex: 1, textAlign: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  emptyTitle: { ...Typography.titleMedium },
  backBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  backBtnText: { ...Typography.subheading, color: '#fff' },

  cardArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    position: 'absolute',
    width: '100%',
    maxWidth: 340,
    aspectRatio: 3 / 4,
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
  },
  cardFront: {},
  cardFrontLabel: { ...Typography.captionBold, position: 'absolute', top: 16, right: 16 },
  cardWord: { ...Typography.cardWord, textAlign: 'center', marginBottom: 24 },
  tapHint: { ...Typography.bodySmall, position: 'absolute', bottom: 24 },
  tapHintBack: { position: 'absolute', bottom: 24 },
  cardBack: {},
  cardBackLabel: { ...Typography.captionBold, color: primary, marginBottom: 12 },
  cardMeaning: { ...Typography.cardMeaning, color: primary, textAlign: 'center', marginBottom: 12 },
  cardExample: { ...Typography.bodySmall, fontStyle: 'italic', textAlign: 'center' },

  footer: { padding: 16, paddingBottom: 32, borderTopWidth: 1 },
  nextBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: { ...Typography.subheading, color: '#fff' },
});
