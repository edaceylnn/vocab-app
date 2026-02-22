import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import Colors, { primary } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { createSet } from '@/lib/db';

export default function NewSetScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const canSave = name.trim().length > 0;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await createSet(name.trim());
      router.back();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create set. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerSpacer} />
        <Text style={[styles.title, { color: colors.text }]}>New set</Text>
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

      <View style={styles.content}>
        <Text style={[styles.label, { color: colors.muted }]}>SET NAME</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.cardBg, color: colors.text }]}
          placeholder="e.g. Fruits, Animals"
          placeholderTextColor={colors.muted}
          value={name}
          onChangeText={setName}
          autoFocus
        />
        <Pressable
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!canSave || saving}
          accessibilityLabel="Create set"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="plus" size={22} color="#fff" />
          <Text style={styles.saveBtnText}>Create set</Text>
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
  content: { padding: 16 },
  label: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  input: { height: 56, borderRadius: 12, paddingHorizontal: 16, borderWidth: 1, fontSize: 16 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    backgroundColor: primary,
    borderRadius: 12,
    marginTop: 24,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
