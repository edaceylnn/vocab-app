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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import Colors, { primary } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { getCardById, updateCard } from '@/lib/db';

export default function EditCardScreen() {
  const router = useRouter();
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [example, setExample] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!cardId) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    getCardById(cardId).then((card) => {
      setLoading(false);
      if (card) {
        setWord(card.front);
        setMeaning(card.back);
        setExample(card.example ?? '');
      } else {
        setNotFound(true);
      }
    });
  }, [cardId]);

  const canSave = word.trim() && meaning.trim();

  const saveEntry = useCallback(async () => {
    if (!cardId || !canSave || saving) return;
    setSaving(true);
    try {
      await updateCard(cardId, word.trim(), meaning.trim(), example.trim() || null);
      router.back();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save changes. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  }, [cardId, word, meaning, example, canSave, saving, router]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  if (notFound) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.text }]}>Word not found</Text>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { borderColor: primary }]}>
          <Text style={[styles.backBtnText, { color: primary }]}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerSpacer} />
        <Text style={[styles.title, { color: colors.text }]}>Edit word</Text>
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
            <MaterialCommunityIcons name="translate" size={20} color={colors.muted} style={styles.inputIcon} />
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
            placeholder="Use it in a sentence..."
            placeholderTextColor={colors.muted}
            value={example}
            onChangeText={setExample}
            multiline
            numberOfLines={4}
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <Pressable
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          onPress={saveEntry}
          disabled={!canSave || saving}
          accessibilityLabel="Save changes"
          accessibilityRole="button"
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="content-save" size={22} color="#fff" />
              <Text style={styles.saveBtnText}>Save changes</Text>
            </>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  notFoundText: { fontSize: 18, fontWeight: '600' },
  backBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, borderWidth: 1.5 },
  backBtnText: { fontSize: 16, fontWeight: '600' },
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
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  field: { marginBottom: 24 },
  label: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 16 },
  input: { flex: 1, height: 56, fontSize: 18 },
  inputFull: { height: 56, borderRadius: 12, paddingHorizontal: 16, borderWidth: 1 },
  inputIcon: { marginLeft: 8 },
  textArea: { minHeight: 120, borderRadius: 12, padding: 16, borderWidth: 1, textAlignVertical: 'top', fontSize: 16 },
  footer: { padding: 16, paddingBottom: 32, borderTopWidth: 1 },
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
