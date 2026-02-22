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
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import Colors, { primary } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { createCard } from '@/lib/db';
import { useSets } from '@/lib/hooks';
import type { SetRow } from '@/lib/types';

export default function AddScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { sets, defaultSet } = useSets();

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

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
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
          <Text style={[styles.label, { color: colors.muted }]}>WORD (ENGLISH)</Text>
          <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="e.g. Epiphany"
              placeholderTextColor={colors.muted}
              value={word}
              onChangeText={setWord}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.muted }]}>MEANING (TURKISH)</Text>
          <TextInput
            style={[styles.input, styles.inputFull, { borderColor: colors.border, backgroundColor: colors.cardBg, color: colors.text }]}
            placeholder="Enter meaning"
            placeholderTextColor={colors.muted}
            value={meaning}
            onChangeText={setMeaning}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.muted }]}>EXAMPLE SENTENCE (OPTIONAL)</Text>
          <TextInput
            style={[styles.textArea, { borderColor: colors.border, backgroundColor: colors.cardBg, color: colors.text }]}
            placeholder="Use it in a sentence to remember better..."
            placeholderTextColor={colors.muted}
            value={example}
            onChangeText={setExample}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.muted }]}>ADD TO SET</Text>
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
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <View style={[styles.rapidFireRow, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
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
        </View>

        <Pressable
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          onPress={saveEntry}
          disabled={!canSave || saving}
          accessibilityLabel="Save entry"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="content-save" size={22} color="#fff" />
          <Text style={styles.saveBtnText}>Save Entry</Text>
        </Pressable>
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
    paddingTop: 48,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: { fontSize: 18, fontWeight: '700' },
  headerSpacer: { width: 40 },
  closeBtn: { padding: 4 },
  progressBarBg: { height: 4 },
  progressBarFill: { height: '100%' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  field: { marginBottom: 24 },
  label: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 16 },
  input: { flex: 1, height: 56, fontSize: 18 },
  inputFull: { height: 56, borderRadius: 12, paddingHorizontal: 16, borderWidth: 1 },
  inputIcon: { marginLeft: 8 },
  textArea: { minHeight: 120, borderRadius: 12, padding: 16, borderWidth: 1, textAlignVertical: 'top', fontSize: 16 },
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
  setChipText: { fontSize: 14, fontWeight: '600', maxWidth: 140 },
  footer: { padding: 16, paddingBottom: 32, borderTopWidth: 1 },
  rapidFireRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  rapidFireLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rapidFireIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(19,91,236,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rapidFireTitle: { fontSize: 14, fontWeight: '700' },
  rapidFireSub: { fontSize: 12, marginTop: 2 },
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
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    backgroundColor: primary,
    borderRadius: 12,
    shadowColor: primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
