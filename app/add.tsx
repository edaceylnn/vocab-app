import { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import Colors, { primary } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { PAGE_PADDING_TOP } from '@/constants/Layout';
import { useColorScheme } from '@/components/useColorScheme';
import { createCard } from '@/lib/db';
import { hapticSuccess } from '@/lib/haptics';
import { useSets } from '@/lib/hooks';
import type { SetRow } from '@/lib/types';
import { Input } from '@/components/ui/Input';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Surface } from '@/components/ui/Surface';

export default function AddScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { sets, defaultSet, loading: setsLoading, error: setsError, refresh: refreshSets } = useSets();

  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [example, setExample] = useState('');
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [rapidFire, setRapidFire] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (sets.length === 0 || !defaultSet) return;
    setSelectedSetId((prev) => {
      if (!prev) return defaultSet.id;
      if (!sets.find((s) => s.id === prev)) return sets[0].id;
      return prev;
    });
  }, [sets, defaultSet]);

  const canSave = word.trim() && meaning.trim() && selectedSetId;

  const saveEntry = useCallback(async () => {
    if (!canSave || saving || !selectedSetId) return;
    setSaving(true);
    try {
      await createCard(selectedSetId, word.trim(), meaning.trim(), example.trim() || null);
      hapticSuccess();
      if (rapidFire) {
        setWord('');
        setMeaning('');
        setExample('');
      } else {
        router.back();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save card. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  }, [word, meaning, example, rapidFire, canSave, saving, router, selectedSetId]);

  const headerPaddingTop = Math.max(insets.top, 16) + PAGE_PADDING_TOP;
  const footerPaddingBottom = Math.max(16, insets.bottom + 16);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View
        style={[
          styles.header,
          {
            borderBottomColor: colors.border,
            paddingTop: headerPaddingTop,
          },
        ]}
      >
        <View style={styles.headerSpacer} />
        <Text style={[styles.title, { color: colors.text }]}>New Vocabulary</Text>
        <Pressable
          onPress={() => router.back()}
          style={styles.closeBtn}
          hitSlop={12}
          accessibilityLabel="Close"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="close" size={24} color={colors.text} />
        </Pressable>
      </View>

      <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
        <View style={[styles.progressBarFill, { backgroundColor: primary, width: '33%' }]} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.field}>
          <Input
            colors={colors}
            label="Word (English)"
            placeholder="e.g. Epiphany"
            value={word}
            onChangeText={setWord}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.field}>
          <Input colors={colors} label="Meaning (Turkish)" placeholder="Enter meaning" value={meaning} onChangeText={setMeaning} />
        </View>

        <View style={styles.field}>
          <Input
            colors={colors}
            label="Example sentence (optional)"
            placeholder="Use it in a sentence to remember better..."
            value={example}
            onChangeText={setExample}
            multiline
            numberOfLines={4}
            inputStyle={styles.exampleInput}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.muted }]}>ADD TO SET</Text>
          {setsError ? (
            <Surface variant="cardMuted" colors={colors} style={styles.setError}>
              <Text style={[styles.setErrorTitle, { color: colors.text }]}>Sets not available</Text>
              <Text style={[styles.setErrorMsg, { color: colors.muted }]} numberOfLines={2}>
                {setsError}
              </Text>
              <Pressable
                onPress={() => void refreshSets()}
                style={({ pressed }) => [{ paddingVertical: 10, paddingHorizontal: 12, opacity: pressed ? 0.9 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel="Retry loading sets"
              >
                <Text style={[styles.retryText, { color: primary }]}>Retry</Text>
              </Pressable>
            </Surface>
          ) : setsLoading ? (
            <Surface variant="cardMuted" colors={colors} style={styles.setLoading}>
              <Text style={[styles.setLoadingText, { color: colors.muted }]}>Loading sets…</Text>
            </Surface>
          ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.setRow}
          >
            {sets.map((s: SetRow) => (
              <Pressable
                key={s.id}
                style={[
                  styles.setChip,
                  selectedSetId === s.id
                    ? { backgroundColor: primary + '18', borderColor: primary }
                    : { backgroundColor: colors.cardBg, borderColor: colors.border },
                ]}
                onPress={() => setSelectedSetId(s.id)}
                accessibilityLabel={`Add to set ${s.name}`}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.setChipText,
                    { color: selectedSetId === s.id ? primary : colors.text },
                  ]}
                  numberOfLines={1}
                >
                  {s.name}
                </Text>
              </Pressable>
            ))}
            <Pressable
              style={[styles.setChip, styles.setChipNew, { borderColor: colors.border, backgroundColor: colors.cardBg }]}
              onPress={() => router.push('/set/new')}
              accessibilityLabel="Create new set"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="plus" size={18} color={primary} />
              <Text style={[styles.setChipText, { color: primary }]}>New set</Text>
            </Pressable>
          </ScrollView>
          )}
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            borderTopColor: colors.border,
            backgroundColor: colors.background,
            paddingBottom: footerPaddingBottom,
          },
        ]}
      >
        <Surface variant="cardMuted" colors={colors} style={styles.rapidFireRow}>
          <View style={styles.rapidFireLeft}>
            <View style={styles.rapidFireIcon}>
              <MaterialCommunityIcons name="lightning-bolt" size={22} color={primary} />
            </View>
            <View>
              <Text style={[styles.rapidFireTitle, { color: colors.text }]}>Rapid-fire Mode</Text>
              <Text style={[styles.rapidFireSub, { color: colors.muted }]}>
                Save and clear fields immediately
              </Text>
            </View>
          </View>
          <Pressable
            style={[styles.toggle, rapidFire && styles.toggleOn]}
            onPress={() => setRapidFire(!rapidFire)}
            accessibilityLabel={rapidFire ? 'Rapid fire mode on' : 'Rapid fire mode off'}
            accessibilityRole="switch"
          >
            <View style={[styles.toggleThumb, rapidFire && styles.toggleThumbOn]} />
          </Pressable>
        </Surface>

        <PrimaryButton
          title="Save Entry"
          colors={colors}
          onPress={saveEntry}
          disabled={!canSave}
          loading={saving}
          style={styles.saveBtn}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: { ...Typography.heading },
  headerSpacer: { width: 40 },
  closeBtn: { padding: 4 },
  progressBarBg: { height: 4 },
  progressBarFill: { height: '100%' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  field: { marginBottom: 24 },
  label: { ...Typography.sectionLabel, marginBottom: 8 },
  inputIcon: { marginLeft: 8 },
  exampleInput: { minHeight: 120, textAlignVertical: 'top' },
  setRow: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 4 },
  setChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  setChipNew: { borderStyle: 'dashed' },
  setChipText: { ...Typography.bodySmallMedium, maxWidth: 140 },
  setLoading: { padding: 12 },
  setLoadingText: { ...Typography.bodySmallMedium },
  setError: { padding: 12, gap: 6 },
  setErrorTitle: { ...Typography.bodySmallMedium },
  setErrorMsg: { ...Typography.caption },
  retryText: { ...Typography.bodySmallMedium },
  footer: { paddingHorizontal: 16, paddingTop: 16, borderTopWidth: 1 },
  rapidFireRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, marginBottom: 16 },
  rapidFireLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rapidFireIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(19,91,236,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rapidFireTitle: { ...Typography.bodySmallMedium },
  rapidFireSub: { ...Typography.caption, marginTop: 2 },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#cbd5e1',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleOn: { backgroundColor: primary },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  toggleThumbOn: { alignSelf: 'flex-end' },
  saveBtn: { marginTop: 4 },
});
